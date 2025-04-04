const categoryModel = require("../models/category.model");
const Category = require("../models/category.model");
const mongoose = require("mongoose");

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
// getAllCategories có hỗ trợ query
const getAllCategories = async ({
    page = 1,
    limit = 100,
    search = "",
    type = "",
    sortBy = "createdAt",
    sortOrder = "desc",
} = {}) => {
    try {
        const query = {};

        if (search) {
            query.name = { $regex: search, $options: "i" };
        }

        if (type === "parent") {
            query.parent_category = null;
        } else if (type === "child") {
            query.parent_category = { $ne: null };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortOption = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

        const [categories, totalCategories] = await Promise.all([
            Category.find(query)
                .populate("parent_category")
                .sort(sortOption)
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            Category.countDocuments(query)
        ]);

        return {
            success: true,
            categories,
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalCategories / limit),
            totalCategories,
            limit: parseInt(limit),
            search,
            type,
            sortBy,
            sortOrder,
        };
    } catch (error) {
        console.error("❌ Error fetching categories:", error);
        return { success: false, message: error.message };
    }
};

const getCategoriesWithProductCount = async (categoryIds) => {
    return await categoryModel.aggregate([
        {
            $match: {
                _id: { $in: categoryIds.map(id => new mongoose.Types.ObjectId(id)) }
            }
        },
        {
            $lookup: {
                from: 'products',
                localField: '_id',
                foreignField: 'category',
                as: 'products'
            }
        },
        {
            $addFields: {
                productCount: { $size: '$products' }
            }
        },
        {
            $project: { products: 0 }
        }
    ]);
}

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
    deleteCategory,
    getCategoriesWithProductCount,
};
