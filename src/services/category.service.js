const Category = require("../models/category.model");

const createCategory = async (data) => {
    return await Category.create(data);
};

const getAllCategories = async () => {
    return await Category.find().populate("parent_category");
};

module.exports = { createCategory, getAllCategories };
