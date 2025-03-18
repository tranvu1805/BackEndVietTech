const Product = require("../models/product.model");
const categoryModel = require("../models/category.model");
const e = require("express");

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

        console.log("check atrii 11",product_attributes);
        console.log("check atrii 2 ",validAttributes);
        

        // Xử lý và kiểm tra biến thể sản phẩm
        const variations = [];
        console.log("check variation 22", variant_names);
        if (variant_names && variant_values && variant_prices && variant_stocks) {
            for (let i = 0; i < variant_names.length; i++) {
                const sku = `SKU-${variant_names[i]}-${variant_values[i]}`;
                console.log("check sku",sku);
                
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




        // res.status(200).json({ success: true, products });
        return products;
    } catch (error) {
        // res.status(500).json({ success: false, message: error.message });
        console.log(error);

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

module.exports = { createProduct, getAllProducts, getProductById, updateProduct, deleteProduct, getAllProducts_Admin, getProductById_Admin };
