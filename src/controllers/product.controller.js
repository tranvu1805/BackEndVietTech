const Product = require("../models/product.model");
const categoryModel = require("../models/category.model");
const e = require("express");
const slugify = require('slugify');
const fs = require('fs');
const path = require("path")
const ExcelJS = require('exceljs')
const ProductService = require("../services/product.service");

const generateSKU = (productName, variantName, variantValue) => {
    const productSlug = slugify(productName, { lower: true, strict: true });
    const variantSlug = slugify(variantName, { lower: true, strict: true });
    const valueSlug = slugify(variantValue, { lower: true, strict: true });

    return `${productSlug}-${variantSlug}-${valueSlug}`;
};

// 🟢 1. Tạo sản phẩm mới
const createProduct = async (req, res) => {
    try {
        const {
            product_name,
            product_description,
            product_price, product_stock,
            category,
            attribute_keys,
            attribute_values,
            variant_names, // Các tên biến thể
            variant_values, // Các giá trị biến thể
            variant_prices, // Giá của các biến thể
            variant_stocks, // Số lượng tồn của các biến thể
            status
        } = req.body;

        console.log("check req: ", req.body);

        let product_thumbnail = req.file ? req.file.path : null;

        // Kiểm tra danh mục có tồn tại không
        const categoryData = await categoryModel.findById(category);
        if (!categoryData) {
            return res.status(400).json({ success: false, message: "Category not found" });
        }

        // Kiểm tra xem danh mục có thuộc tính hợp lệ không
        if (!categoryData.attributes_template) {
            return res.status(400).json({ success: false, message: "Danh mục không có thuộc tính hợp lệ." });
        }

        if (!req.file && !product_thumbnail) {
            return res.status(400).json({ success: false, message: "File upload failed. Please ensure the file is attached." });
        }

        // Xử lý thuộc tính sản phẩm
        const product_attributes = {};
        if (attribute_keys && attribute_values) {
            attribute_keys.forEach((key, index) => {
                if (attribute_values[index]) {
                    product_attributes[key] = attribute_values[index];
                }
            });
        }

        // Kiểm tra thuộc tính hợp lệ
        const validAttributes = {};
        categoryData.attributes_template.forEach(attr => {
            if (product_attributes[attr]) {
                validAttributes[attr] = product_attributes[attr];
            }
        });

        console.log("check atrii 11", product_attributes);
        console.log("check atrii 2 ", validAttributes);


        // Xử lý và kiểm tra biến thể sản phẩm
        const variations = [];
        console.log("check variation 22", variant_names);
        if (variant_names && variant_values && variant_prices && variant_stocks) {
            for (let i = 0; i < variant_names.length; i++) {
                const sku = generateSKU(product_name, variant_names[i], variant_values[i]);
                console.log("check sku", sku);

                variations.push({
                    variant_name: variant_names[i],
                    variant_value: variant_values[i],
                    price: variant_prices[i],
                    stock: variant_stocks[i],
                    sku: sku // Tạo sku duy nhất cho mỗi biến thể
                });
            }
        }

        console.log("check variation", variations);


        // Kiểm tra và xử lý variations
        variations.forEach(variation => {
            if (!variation.variant_name || !variation.variant_value || !variation.price || !variation.stock || !variation.sku) {
                return res.status(400).json({ success: false, message: "Variation details are incomplete" });
            }
        });



        // Tạo sản phẩm mới
        const product = await Product.create({
            product_name,
            product_thumbnail,
            product_description,
            product_price,
            product_stock,
            category,
            product_attributes: validAttributes,
            variations,
            status
        });

        res.status(201).json({ success: true, product });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};


// 🟢 2. Lấy danh sách sản phẩm (hỗ trợ lọc & phân trang)
const getAllProducts = async (req, res) => {
    try {
        const { category, search, minPrice, maxPrice, page = 1, limit = 10, variant_name, variant_value } = req.query;
        let filter = {};

        if (category) filter.category = category;
        if (search) filter.product_name = new RegExp(search, "i");
        if (minPrice || maxPrice) {
            filter.product_price = {};
            if (minPrice) filter.product_price.$gte = parseFloat(minPrice);
            if (maxPrice) filter.product_price.$lte = parseFloat(maxPrice);
        }
        // Lọc theo biến thể
        if (variant_name && variant_value) {
            filter.variations = {
                $elemMatch: {
                    variant_name: variant_name,
                    variant_value: variant_value
                }
            };
        }

        const products = await Product.find(filter)
            .populate("category")
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        res.status(200).json({ success: true, products });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getAllProducts_Admin = async (req, res) => {
    try {
        const {
            category,
            search,
            name,
            status,
            stock,
            minPrice,
            maxPrice,
            page = 1,
            limit = 5,
            variant_name,
            variant_value,
            sort
        } = req.query;

        let filter = {};

        // Lọc theo danh mục
        if (category) filter.category = category;

        // Tìm kiếm theo tên sản phẩm (không phân biệt hoa thường)
        if (name || search) {
            filter.product_name = new RegExp(name || search, "i");
        }

        if (stock) {
            if (stock === 'high') filter.product_stock = { $gt: 50 };
            else if (stock === 'medium') filter.product_stock = { $gt: 10, $lte: 50 };
            else if (stock === 'low') filter.product_stock = { $lte: 10 };
        }


        // Lọc theo giá
        if (minPrice || maxPrice) {
            filter.product_price = {};
            if (minPrice) filter.product_price.$gte = parseFloat(minPrice);
            if (maxPrice) filter.product_price.$lte = parseFloat(maxPrice);
        }

        if (status) {
            if (status === 'active') {
                filter.isPulished = true;
                filter.isDraft = false;
            } else if (status === 'inactive') {
                filter.isPulished = false;
                filter.isDraft = false;
            } else if (status === 'draft') {
                filter.isDraft = true;
            }
        }

        // Lọc theo biến thể
        if (variant_name && variant_value) {
            filter.variations = {
                $elemMatch: {
                    variant_name: variant_name,
                    variant_value: variant_value
                }
            };
        }

        // Đếm tổng số sản phẩm (phục vụ phân trang)
        const totalCount = await Product.countDocuments(filter);
        const totalPages = Math.ceil(totalCount / limit);

        let sortOption = {};
        if (sort === 'price_asc') sortOption.product_price = 1;
        else if (sort === 'price_desc') sortOption.product_price = -1;
        else if (sort === 'stock_asc') sortOption.product_stock = 1;
        else if (sort === 'stock_desc') sortOption.product_stock = -1;

        const products = await Product.find(filter)
            .sort(sortOption)
            .populate("category")
            .skip((page - 1) * limit)
            .limit(Number(limit));

        return { products, totalPages, currentPage: Number(page), totalCount };
    } catch (error) {
        console.error("Error getAllProducts_Admin:", error);
        return {
            products: [],
            total: 0,
            currentPage: 1,
            totalPages: 1,
            error: error.message
        };
    }
};



// 🟢 3. Lấy chi tiết sản phẩm
const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate("category");
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }
        res.status(200).json({ success: true, product });
    } catch (error) {
        console.log("error", error.message);

        res.status(500).json({ success: false, message: error.message });
    }
};


const getProductById_Admin = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate("category");
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }
        return product;
    } catch (error) {
        console.error("Error fetching product:", error.message);
    }
};

// 🟢 4. Cập nhật sản phẩm
const updateProduct = async (req, res) => {
    try {
        const { variations } = req.body; // Lấy variations từ body
        console.log("Received data update:", req.body);  // Log dữ liệu nhận được  
        console.log("Received file update:", req.file);  // Log dữ liệu nhận được


        // Kiểm tra và xử lý variations (biến thể sản phẩm)
        if (variations && variations.length > 0) {
            variations.forEach(variation => {
                if (!variation.variant_name || !variation.variant_value || !variation.price || !variation.stock || !variation.sku) {
                    return res.status(400).json({ success: false, message: "Variation details are incomplete" });
                }
            });
        }

        const productData = {
            ...req.body,
            product_thumbnail: req.file ? req.file.path : undefined
        };

        const updatedProduct = await Product.findByIdAndUpdate(req.params.id, productData, { new: true });
        if (!updatedProduct) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }
        res.status(200).json({ success: true, updatedProduct });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 🟢 5. Xóa sản phẩm
const deleteProduct = async (req, res) => {
    try {
        const deletedProduct = await Product.findByIdAndDelete(req.params.id);
        if (!deletedProduct) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }
        res.status(200).json({ success: true, message: "Product deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 🟢 6. Xuất sản phẩm qua excel
const exportProductsToExcel = async (req, res, next) => {
    try {
        const products = await ProductService.getAllProducts(); // Lấy danh sách sản phẩm từ DB

        const workbook = new ExcelJS.Workbook();
        // Thêm thông tin metadata cho file
        workbook.creator = 'Hệ thống quản lý sản phẩm';
        workbook.lastModifiedBy = 'Hệ thống';
        workbook.created = new Date();
        workbook.modified = new Date();

        const worksheet = workbook.addWorksheet('Danh sách sản phẩm', {
            properties: {
                tabColor: { argb: '3D85C6' } // Màu tab xanh dương
            },
            pageSetup: {
                paperSize: 9, // A4
                orientation: 'landscape',
                fitToPage: true
            }
        });

        // Định nghĩa các cột trong file Excel với kiểu dữ liệu
        worksheet.columns = [
            { header: 'ID', key: 'product_id', width: 10 },
            { header: 'Tên sản phẩm', key: 'product_name', width: 30 },
            { header: 'Ảnh đại diện', key: 'product_thumbnail', width: 40 },
            { header: 'Mô tả', key: 'product_description', width: 50 },
            { header: 'Giá (₫)', key: 'product_price', width: 15, style: { numFmt: '#,##0' } },
            { header: 'Kho', key: 'product_stock', width: 10 },
            { header: 'Danh mục', key: 'category', width: 20 },
            { header: 'Thuộc tính', key: 'product_attributes', width: 40 },
            { header: 'Đánh giá TB', key: 'product_ratingsAverage', width: 15, style: { numFmt: '0.0' } },
            { header: 'Slug', key: 'product_slug', width: 30 },
            { header: 'Bản nháp?', key: 'isDraft', width: 10 },
            { header: 'Đã xuất bản?', key: 'isPulished', width: 15 },
            { header: 'Biến thể', key: 'variations', width: 60 }
        ];

        // Tạo style cho header
        const headerRow = worksheet.getRow(1);
        headerRow.height = 30; // Điều chỉnh chiều cao hàng tiêu đề
        headerRow.font = {
            name: 'Arial',
            size: 12,
            bold: true,
            color: { argb: 'FFFFFF' } // Màu chữ trắng
        };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '4472C4' } // Màu nền xanh dương đậm
        };
        headerRow.alignment = {
            vertical: 'middle',
            horizontal: 'center',
            wrapText: true
        };

        // Thêm dữ liệu vào từng dòng với format
        products.forEach((product, index) => {
            const rowIndex = index + 2; // Bắt đầu từ hàng 2 (sau header)

            // Format thuộc tính sản phẩm thành cấu trúc dễ đọc
            let formattedAttributes = '';
            if (product.product_attributes && Object.keys(product.product_attributes).length > 0) {
                formattedAttributes = Object.entries(product.product_attributes)
                    .map(([key, value]) => {
                        // Format key name to be more readable (e.g., battery_life -> Battery Life)
                        const formattedKey = key
                            .split('_')
                            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(' ');
                        return `• ${formattedKey}: ${value}`;
                    })
                    .join('\n');
            }

            // Format biến thể sản phẩm thành cấu trúc dễ đọc
            let formattedVariations = '';
            if (product.variations && product.variations.length > 0) {
                formattedVariations = product.variations
                    .map((variant, i) => {
                        return `• Biến thể ${i + 1}: ${variant.variant_name} ${variant.variant_value}\n  - Giá: ${variant.price.toLocaleString()}₫\n  - Kho: ${variant.stock}\n  - SKU: ${variant.sku}`;
                    })
                    .join('\n\n');
            }

            const row = worksheet.addRow({
                product_id: product._id?.toString() || '',
                product_name: product.product_name,
                product_thumbnail: product.product_thumbnail,
                product_description: product.product_description || '',
                product_price: product.product_price,
                product_stock: product.product_stock,
                category: product.category?.name || '',
                product_attributes: formattedAttributes,
                product_ratingsAverage: product.product_ratingsAverage,
                product_slug: product.product_slug,
                isDraft: product.isDraft ? 'Có' : 'Không',
                isPulished: product.isPulished ? 'Có' : 'Không',
                variations: formattedVariations
            });

            // Thiết lập định dạng hàng
            row.height = 25 * Math.max(
                1,
                (formattedAttributes.split('\n').length || 1),
                (formattedVariations.split('\n').length || 1) / 2
            ); // Tăng chiều cao hàng dựa trên số dòng trong thuộc tính và biến thể

            // Đảm bảo các ô trong cột thuộc tính và biến thể được wrap text và căn đều
            worksheet.getCell(`H${rowIndex}`).alignment = {
                vertical: 'top',
                wrapText: true
            };

            worksheet.getCell(`M${rowIndex}`).alignment = {
                vertical: 'top',
                wrapText: true
            };

            // Định dạng hiển thị cho các cột khác
            row.alignment = {
                vertical: 'middle',
                wrapText: true
            };

            // Định dạng màu nền xen kẽ cho dễ đọc
            if (index % 2 === 0) {
                row.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'F2F2F2' } // Màu xám nhạt
                };
            }

            // Định dạng cho cột giá và cột biến thể
            worksheet.getCell(`E${rowIndex}`).numFmt = '#,##0'; // Định dạng số cho cột giá
            worksheet.getCell(`I${rowIndex}`).numFmt = '0.0'; // Định dạng số thập phân cho cột đánh giá

            // Định dạng cho cột trạng thái
            const isDraftCell = worksheet.getCell(`K${rowIndex}`);
            const isPublishedCell = worksheet.getCell(`L${rowIndex}`);

            // Đổi màu cho trạng thái
            isDraftCell.alignment = { horizontal: 'center', vertical: 'middle' };
            isPublishedCell.alignment = { horizontal: 'center', vertical: 'middle' };

            if (product.isDraft) {
                isDraftCell.font = { bold: true, color: { argb: 'FF0000' } }; // Màu đỏ đậm
            } else {
                isDraftCell.font = { color: { argb: '006100' } }; // Màu xanh lá
            }

            if (product.isPulished) {
                isPublishedCell.font = { bold: true, color: { argb: '006100' } }; // Màu xanh lá đậm
            } else {
                isPublishedCell.font = { bold: true, color: { argb: 'FF0000' } }; // Màu đỏ đậm
            }
        });

        // Thêm viền cho tất cả các ô có dữ liệu
        const allCells = worksheet.getRows(1, products.length + 1);
        allCells.forEach(row => {
            row.eachCell({ includeEmpty: true }, cell => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });
        });

        // Đặt filter cho header để dễ tìm kiếm
        worksheet.autoFilter = {
            from: { row: 1, column: 1 },
            to: { row: 1, column: worksheet.columns.length }
        };

        // Cố định hàng đầu tiên khi cuộn
        worksheet.views = [
            { state: 'frozen', xSplit: 0, ySplit: 1, activeCell: 'A2' }
        ];

        // Tạo thư mục xuất nếu chưa tồn tại
        const exportDir = path.join(__dirname, '../../exports');
        if (!fs.existsSync(exportDir)) {
            fs.mkdirSync(exportDir, { recursive: true });
        }

        // Tạo tên file có timestamp để tránh trùng lặp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `products_export_${timestamp}.xlsx`;
        const filePath = path.join(exportDir, fileName);

        await workbook.xlsx.writeFile(filePath);
        return res.download(filePath, fileName, (err) => {
            if (err) {
                next(err);
            } else {
                // Tùy chọn: Xóa file sau khi đã tải xuống để tiết kiệm dung lượng
                // setTimeout(() => fs.unlinkSync(filePath), 5000);
            }
        });
    } catch (error) {
        console.error('❌ Lỗi xuất Excel:', error);
        return next(error);
    }
};

// 🟢 7. Lọc sản phẩm theo Danh Mục
const getProductsByCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const products = await ProductService.findByCategory(categoryId);

        return res.status(200).json({
            message: "Lấy sản phẩm theo danh mục thành công",
            metadata: products
        });
    } catch (error) {
        return res.status(500).json({
            message: "Lỗi khi lấy sản phẩm theo category",
            error
        });
    }
};

const getTopSellingProducts = async (req, res) => {
    try {
        const result = await ProductService.getTopSellingProducts(); // gọi service xử lý logic
        return res.status(200).json(result);
    } catch (error) {
        console.error("🔥 Lỗi khi lấy top sản phẩm bán chạy:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message || error });
    }
};


module.exports = {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    getAllProducts_Admin,
    getProductById_Admin,
    exportProductsToExcel,
    getProductsByCategory,
    getTopSellingProducts
};
