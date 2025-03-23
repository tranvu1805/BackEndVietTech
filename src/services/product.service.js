const Product = require("../models/product.model");
const Category = require("../models/category.model");
const billModel = require("../models/bill.model");
const { Types } = require("mongoose");

class ProductService {
    static async createProduct() {
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

    static async getAllProducts() {
        return await Product.find().populate("category");
    };

    static async findByCategory(categoryId) {
        return await Product.find({ category: categoryId });
    };

    static async getTopSellingProducts(limit = 5) {
        const result = await billModel.billRepo.aggregate([
            { $unwind: "$products" },
            {
                $addFields: {
                    "products.productId": {
                        $cond: [
                            { $not: [{ $eq: [{ $type: "$products.productId" }, "objectId"] }] },
                            { $toObjectId: "$products.productId" },
                            "$products.productId"
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: "$products.productId", // ObjectId now
                    totalSold: { $sum: "$products.quantity" }
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: limit },
            {
                $lookup: {
                    from: "Products",
                    localField: "_id",
                    foreignField: "_id",
                    as: "product"
                }
            },
            { $unwind: "$product" },
            {
                $project: {
                    _id: 0,
                    productId: "$_id",
                    totalSold: 1,
                    product_name: "$product.product_name",
                    product_price: "$product.product_price",
                    product_stock: "$product.product_stock"
                }
            }
        ]);

        console.log("🔥 Top selling result:", result);
        return result;
    }

}

module.exports = ProductService;
