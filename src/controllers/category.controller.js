const Category = require("../models/category.model");

// Tạo một danh mục mới
const createCategory = async (req, res) => {
    try {
        const { name, parent_category, attributes_template } = req.body;
        // Kiểm tra nếu thiếu bất kỳ trường nào
        if (!name || !attributes_template) {
            return res.status(400).json({ success: false, message: "Name and attributes_template are required!" });
        }

        const category = await Category.create({ name, parent_category, attributes_template });
        res.status(201).json({ success: true, category });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Lấy tất cả danh mục
const getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find().populate("parent_category");
        return categories;
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Lấy một danh mục theo id
const getCategoryById = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id).populate("parent_category");
        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found!" });
        }
        res.status(200).json({ success: true, category });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Cập nhật thông tin danh mục
const updateCategory = async (req, res) => {
    try {
        const { name, parent_category, attributes_template } = req.body;
        const updatedCategory = await Category.findByIdAndUpdate(
            req.params.id,
            { name, parent_category, attributes_template },
            { new: true }
        );

        if (!updatedCategory) {
            return res.status(404).json({ success: false, message: "Category not found!" });
        }
        res.status(200).json({ success: true, updatedCategory });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Xóa một danh mục
const deleteCategory = async (req, res) => {
    try {
        const deletedCategory = await Category.findByIdAndDelete(req.params.id);
        if (!deletedCategory) {
            return res.status(404).json({ success: false, message: "Category not found!" });
        }
        res.status(200).json({ success: true, message: "Category deleted successfully!" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createCategory,
    getAllCategories,
    getCategoryById,
    updateCategory,
    deleteCategory
};
