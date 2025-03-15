const mongoose = require("mongoose");
const { Types } = require("mongoose");

const DOCUMENT_NAME = "discount";
const COLLECTION_NAME = "discounts";

const DiscountSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: true,
            unique: true,
        },
        discount_amount: {
            type: Number, // Số tiền giảm trực tiếp
            required: true,
        },
        min_order_value: {
            type: Number, // Giá trị đơn hàng tối thiểu để áp dụng
            default: 0,
        },
        expiration_date: {
            type: Date, // Ngày hết hạn
            required: true,
        },
        is_active: {
            type: Boolean,
            default: true, // Chỉ áp dụng nếu mã còn hiệu lực
        }
    },
    {
        timestamps: true,
        collection: COLLECTION_NAME
    }
);

module.exports = {
    discountRepo: mongoose.model(DOCUMENT_NAME, DiscountSchema)
};
