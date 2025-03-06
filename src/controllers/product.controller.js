const Product = require("../models/product.model");

// 🟢 1. Tạo sản phẩm mới
const createProduct = async (req, res) => {
    try {
        const { product_name, product_thumbnail, product_description, product_price, product_stock, category, product_attributes } = req.body;

        // Kiểm tra danh mục có tồn tại không
        const categoryData = await Category.findById(category);
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

        const product = await Product.create({
            product_name,
            product_thumbnail,
            product_description,
            product_price,
            product_stock,
            category,
            product_attributes: validAttributes
        });

        res.status(201).json({ success: true, product });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 🟢 2. Lấy danh sách sản phẩm (hỗ trợ lọc & phân trang)
const getAllProducts = async (req, res) => {
    try {
        const { category, search, minPrice, maxPrice, page = 1, limit = 10 } = req.query;
        let filter = {};

        if (category) filter.category = category;
        if (search) filter.product_name = new RegExp(search, "i");
        if (minPrice || maxPrice) {
            filter.product_price = {};
            if (minPrice) filter.product_price.$gte = parseFloat(minPrice);
            if (maxPrice) filter.product_price.$lte = parseFloat(maxPrice);
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

module.exports = { createProduct, getAllProducts, getProductById, updateProduct, deleteProduct };
