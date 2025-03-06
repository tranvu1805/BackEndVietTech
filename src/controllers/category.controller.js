const Category = require("../models/category.model");

const createCategory = async (req, res) => {
    try {
        const { name, parent_category, attributes_template } = req.body;
        const category = await Category.create({ name, parent_category, attributes_template });
        res.status(201).json({ success: true, category });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find().populate("parent_category");
        res.status(200).json({ success: true, categories });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { createCategory, getAllCategories };
