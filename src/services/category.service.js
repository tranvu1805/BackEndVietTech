const Category = require("../models/category.model");

// Tạo mới một danh mục
const createCategory = async (data) => {
    try {
        const category = await Category.create(data);
        return { success: true, category };
    } catch (error) {
        console.error("❌ Error creating category:", error);
        return { success: false, message: error.message };
    }
};

// Lấy tất cả các danh mục
const getAllCategories = async () => {
    try {
        const categories = await Category.find().populate("parent_category");
        return { success: true, categories };
    } catch (error) {
        console.error("❌ Error fetching categories:", error);
        return { success: false, message: error.message };
    }
};

// Lấy một danh mục theo ID
const getCategoryById = async (id) => {
    try {
        const category = await Category.findById(id).populate("parent_category");
        if (!category) {
            return { success: false, message: "Category not found" };
        }
        return { success: true, category };
    } catch (error) {
        console.error("❌ Error fetching category:", error);
        return { success: false, message: error.message };
    }
};

// Cập nhật danh mục
const updateCategory = async (id, data) => {
    try {
        const updatedCategory = await Category.findByIdAndUpdate(id, data, { new: true });
        if (!updatedCategory) {
            return { success: false, message: "Category not found" };
        }
        return { success: true, updatedCategory };
    } catch (error) {
        console.error("❌ Error updating category:", error);
        return { success: false, message: error.message };
    }
};

// Xóa danh mục
const deleteCategory = async (id) => {
    try {
        const deletedCategory = await Category.findByIdAndDelete(id);
        if (!deletedCategory) {
            return { success: false, message: "Category not found" };
        }
        return { success: true, message: "Category deleted successfully" };
    } catch (error) {
        console.error("❌ Error deleting category:", error);
        return { success: false, message: error.message };
    }
};

module.exports = {
    createCategory,
    getAllCategories,
    getCategoryById,
    updateCategory,
    deleteCategory
};
    