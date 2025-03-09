const Product = require("../models/product.model");
const Category = require("../models/category.model");

const createProduct = async (data) => {
    // Kiểm tra danh mục có tồn tại không
    const categoryData = await Category.findById(data.category);
    if (!categoryData) {
        throw new Error("Category not found");
    }

    // Kiểm tra và lưu trữ các thuộc tính hợp lệ từ category
    const validAttributes = {};
    categoryData.attributes_template.forEach(attr => {
        if (data.product_attributes[attr] !== undefined) {
            validAttributes[attr] = data.product_attributes[attr];
        }
    });

    // Kiểm tra và xử lý variations (biến thể)
    if (data.variations && data.variations.length > 0) {
        data.variations.forEach(variation => {
            if (!variation.variant_name || !variation.variant_value || !variation.price || !variation.stock || !variation.sku) {
                throw new Error("Variation details are incomplete");
            }
        });
    }

    // Tạo sản phẩm mới với các thuộc tính hợp lệ và biến thể
    return await Product.create({
        ...data,
        product_attributes: validAttributes,
    });
};

const getAllProducts = async () => {
    return await Product.find().populate("category");
};

module.exports = { createProduct, getAllProducts };
