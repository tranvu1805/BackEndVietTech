const Product = require("../models/product.model");
const Category = require("../models/category.model");

const createProduct = async (data) => {
    const categoryData = await Category.findById(data.category);
    if (!categoryData) {
        throw new Error("Category not found");
    }

    const validAttributes = {};
    categoryData.attributes_template.forEach(attr => {
        if (data.product_attributes[attr] !== undefined) {
            validAttributes[attr] = data.product_attributes[attr];
        }
    });

    return await Product.create({ ...data, product_attributes: validAttributes });
};

const getAllProducts = async () => {
    return await Product.find().populate("category");
};

module.exports = { createProduct, getAllProducts };
