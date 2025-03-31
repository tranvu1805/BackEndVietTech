const Product = require("../models/product.model");
const Category = require("../models/category.model");
const billModel = require("../models/bill.model");
const { Types } = require("mongoose");
const slugify = require("slugify");

const detailsVariantModel = require("../models/detailsVariant.model");
const attributeModel = require("../models/attribute.model");

const generateSKU = (productName, combination) => {
    const productSlug = slugify(productName, { lower: true, strict: true });

    const variantsSlug = Object.entries(combination)
        .map(([key, value]) => `${slugify(key, { lower: true })}-${slugify(value, { lower: true })}`)
        .join('-');

    return `${productSlug}-${variantsSlug}`;
};

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
                if (!variation.variant_name || !variation.variant_value || !variation.price || !variation.stock) {
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

    static async createVariantsAndCombinations(productId, variant_attributes, combinations, productName) {
        const variantMap = {};
        const attributeIds = [];

        // ✅ Tạo hoặc cập nhật bảng Attribute
        for (const attr of variant_attributes) {
            if (!attr.variantName || !attr.values || !Array.isArray(attr.values)) {
                throw new Error(`Thiếu variantName hoặc values: ${JSON.stringify(attr)}`);
            }

            let variant = await attributeModel.findOne({ name: attr.variantName });

            if (!variant) {
                variant = await attributeModel.create({ name: attr.variantName, values: attr.values });
            } else {
                const newValues = [...new Set([...variant.values, ...attr.values])];
                variant.values = newValues;
                await variant.save();
            }

            variantMap[attr.variantName] = variant._id;
            attributeIds.push(variant._id); // <- Thêm vào danh sách attributeIds
        }

        // ✅ Kiểm tra trùng SKU
        for (const combo of combinations) {
            const sku = generateSKU(productName, combo.combination);
            const existing = await detailsVariantModel.findOne({ sku });
            if (existing) {
                throw new Error(`Tổ hợp biến thể đã tồn tại (SKU: ${sku})`);
            }
        }

        // ✅ Tạo tổ hợp biến thể
        for (const combo of combinations) {
            const variantDetails = [];

            for (const [variantName, value] of Object.entries(combo.combination)) {
                const variantId = variantMap[variantName];
                if (!variantId) throw new Error(`Không tìm thấy variant "${variantName}"`);

                variantDetails.push({ variantId, value });
            }

            const sku = generateSKU(productName, combo.combination);

            await detailsVariantModel.create({
                productId,
                variantDetails,
                price: combo.price,
                compareAtPrice: combo.compareAtPrice || undefined,
                stock: combo.stock,
                sku
            });
        }

        return {
            skipped: 0,
            createdCount: combinations.length,
            attributeIds
        };
    }




}

module.exports = ProductService;
