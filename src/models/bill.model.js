const mongoose = require("mongoose");
const { Types } = require("mongoose");
const DOCUMENT_NAME = 'bill';
const COLLECTION_NAME = 'bills';

const BillSchema = new mongoose.Schema(
    {
        user_id: {
            type: Types.ObjectId,
            required: true,
        },
        products: [
            {
                productId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Product"
                },
                name: String,
                price: Number,
                quantity: Number,
                image: String,
                detailsVariantId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "DetailsVariant" // KHÔNG ĐƯỢC GÕ SAI TÊN MODEL!
                },
                isSelected: Boolean
            }
        ],
        total: {
            type: Number,
        },
        shipping_fee: {
            type: Number,
            required: true,
            default: 35,
        },
        address: {
            type: String,
            required: true,
        },
        phone_number: {
            type: String,
            required: true,
        },
        receiver_name: {
            type: String,
            required: true,
        },
        order_code: {
            type: Number,
            required: true,
            unique: true,
        },
        status: {
            type: String,
            required: true,
            enum: ["active", "completed", "cancelled", "pending"],
            default: "pending",
        },
        payment_method: {
            type: String,
            required: true,
            enum: ["ck", "tm", "vnpay"],
            default: "ck",
        },
        discount_code: {
            type: String,
            default: null, // Lưu mã giảm giá (nếu có)
        },
        discount_amount: {
            type: Number,
            default: 0, // Lưu số tiền đã giảm
        },
        isPay: {
            type: Boolean,
            default: false, // Mặc định là false, sau khi ck thành công sẽ cập nhật thành true
        },

    },
    {
        timestamps: true,
        collection: COLLECTION_NAME
    }
);

module.exports = {
    billRepo: mongoose.model(DOCUMENT_NAME, BillSchema)
};
