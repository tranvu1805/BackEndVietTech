const Product = require("../models/product.model");
const categoryModel = require("../models/category.model");

// 🟢 1. Tạo sản phẩm mới
const createProduct = async (req, res) => {
    try {
        const { product_name, product_thumbnail, product_description, product_price, product_stock, category, product_attributes,variations } = req.body;

        console.log(category);


        // Kiểm tra danh mục có tồn tại không
        const categoryData = await categoryModel.findById(category);
        if (!categoryData) {
            return res.status(400).json({ success: false, message: "Category not found" });
        }

        // Kiểm tra thuộc tính hợp lệ
        const validAttributes = {};
        categoryData.attributes_template.forEach(attr => {
            if (product_attributes[attr] !== undefined) {
                validAttributes[attr] = product_attributes[attr];
            }
        });

        // Kiểm tra và xử lý variations (biến thể sản phẩm)
        if (variations && variations.length > 0) {
            variations.forEach(variation => {
                if (!variation.variant_name || !variation.variant_value || !variation.price || !variation.stock || !variation.sku) {
                    return res.status(400).json({ success: false, message: "Variation details are incomplete" });
                }
            });
        }

        const product = await Product.create({
            product_name,
            product_thumbnail,
            product_description,
            product_price,
            product_stock,
            category,
            product_attributes: validAttributes,
            variations
        });

        res.status(201).json({ success: true, product });
    } catch (error) {
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
        res.status(500).json({ success: false, message: error.message });
    }
};

// 🟢 4. Cập nhật sản phẩm
const updateProduct = async (req, res) => {
    try {
        const { variations } = req.body; // Lấy variations từ body

        // Kiểm tra và xử lý variations (biến thể sản phẩm)
        if (variations && variations.length > 0) {
            variations.forEach(variation => {
                if (!variation.variant_name || !variation.variant_value || !variation.price || !variation.stock || !variation.sku) {
                    return res.status(400).json({ success: false, message: "Variation details are incomplete" });
                }
            });
        }

        const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
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

module.exports = { createProduct, getAllProducts, getProductById, updateProduct, deleteProduct,getAllProducts_Admin };
