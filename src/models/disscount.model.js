const mongoose = require("mongoose");
const { Types } = require("mongoose");

const DOCUMENT_NAME = "discount";
const COLLECTION_NAME = "discounts";

const DiscountSchema = new mongoose.Schema(
    {
        code: { type: String, required: true, unique: true },

        name: { type: String, required: true }, // Tên khuyến mãi
        description: { type: String },

        discountType: {
            type: String,
            enum: ["percentage", "fixed", "shipping"],
            required: true,
        },
        discountValue: { type: Number, required: true },

        minOrderValue: { type: Number, default: 0 },
        maxDiscountAmount: { type: Number }, // Giảm tối đa

        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },

        isDraft: { type: Boolean, default: false },
        createdBy: { type: String }, // hoặc ref: 'User' nếu dùng hệ thống tài khoản

        applyTo: {
            type: String,
            enum: ["all", "specific_products", "specific_categories"],
            default: "all",
        },

        appliedProducts: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
            },
        ],
        appliedCategories: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Category",
            },
        ],
        usedByUsers: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Account'
            }
        ],


        usageLimit: { type: Number },
        usageCount: { type: Number, default: 0 },
    },
    {
        timestamps: true,
        collection: COLLECTION_NAME,
    }
);


module.exports = {
    discountRepo: mongoose.model(DOCUMENT_NAME, DiscountSchema)
};
