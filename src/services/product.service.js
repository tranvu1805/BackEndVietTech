const Product = require("../models/product.model");
const Category = require("../models/category.model");
const billModel = require("../models/bill.model");
const { Types } = require("mongoose");
const slugify = require("slugify");

const detailsVariantModel = require("../models/detailsVariant.model");
const attributeModel = require("../models/attribute.model");
const logModel = require("../models/log.model");

const generateSKU = (productName, combination) => {
    const productSlug = slugify(productName, { lower: true, strict: true });

    const variantsSlug = Object.entries(combination)
        .map(([key, value]) => `${slugify(key, { lower: true })}-${slugify(value, { lower: true })}`)
        .join('-');

    return `${productSlug}-${variantsSlug}`;
};

const updateProductStock = async (productId) => {
    const variants = await detailsVariantModel.find({ productId });
    const totalStock = variants.reduce((sum, v) => sum + (v.stock || 0), 0);
    await Product.findByIdAndUpdate(productId, { product_stock: totalStock });
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
        const newProduct = await Product.create({
            ...data,
            product_attributes: validAttributes,
        });

        // Log sau khi tạo thành công
        await Log.create({
            action: 'create',
            target_type: 'Product',
            target_id: newProduct._id,
            after: newProduct,
            changed_by: req.user?._id,
            note: `Tạo mới sản phẩm: ${newProduct.product_name}`
        });

        return newProduct;



    };

    static async getAllProducts() {
        return await Product.find().populate("category");
    };

    static async findByCategory(categoryId) {
        return await Product.find({ category: categoryId });
    };

    static async getTopSellingProducts(limit = 6) {
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

    static async getListTopSellingProducts({ month, page = 1, limit = 10, search }) {
        const match = {};

        if (month) {
            const year = new Date().getFullYear();
            const start = new Date(year, month - 1, 1);
            const end = new Date(year, month, 0, 23, 59, 59);
            match.createdAt = { $gte: start, $lte: end };
        }

        console.log("🔥 Match pro:", match);
        
        match.status = 'completed'; // Đảm bảo chỉ lấy đơn đã hoàn thành

        const pipeline = [
            { $match: match }, // ✅ Đặt trước $unwind!
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
                $lookup: {
                    from: "Products",
                    localField: "products.productId",
                    foreignField: "_id",
                    as: "product"
                }
            },
            { $unwind: "$product" },
            {
                $match: search
                    ? { "product.product_name": { $regex: search, $options: "i" } }
                    : {}
            },
            {
                $group: {
                    _id: "$products.productId",
                    totalSold: { $sum: "$products.quantity" },
                    product_name: { $first: "$product.product_name" },
                    product_stock: { $first: "$product.product_stock" },
                    product_price: { $first: "$product.product_price" }
                }
            },
            { $sort: { totalSold: -1 } },
            {
                $facet: {
                    data: [
                        { $skip: (page - 1) * limit },
                        { $limit: limit }
                    ],
                    totalCount: [{ $count: "count" }]
                }
            }
        ];


        const result = await billModel.billRepo.aggregate(pipeline);

        const products = result[0].data;
        const totalCount = result[0].totalCount[0]?.count || 0;
        const totalPages = Math.ceil(totalCount / limit);

        console.log("🔥 Top selling products result:", products);
        console.log("🔥 Total count:", totalCount);


        return { products, totalCount, totalPages };
    }
    static async createVariantsAndCombinations(productId, variant_attributes, combinations, productName, userId) {
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
                await logModel.create({
                    action: 'warning',
                    target_type: 'DetailsVariant',
                    target_id: existing._id,
                    changed_by: userId,
                    note: `Cố gắng thêm SKU trùng: ${sku}`
                });
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

            const newVariant = await detailsVariantModel.create({
                productId,
                variantDetails,
                price: combo.price,
                compareAtPrice: combo.compareAtPrice || undefined,
                stock: combo.stock,
                sku
            });


            await logModel.create({
                action: 'create',
                target_type: 'DetailsVariant',
                target_id: newVariant._id,
                after: newVariant,
                changed_by: userId,
                note: `Tạo biến thể SKU: ${sku} cho sản phẩm: ${productName}`
            });



        }
        await updateProductStock(productId);
        return {
            skipped: 0,
            createdCount: combinations.length,
            attributeIds
        };
    }




}

module.exports = ProductService;
