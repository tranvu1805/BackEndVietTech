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
        products: {
            type: Array,
            required: true,
            default: [],
        },
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
            enum: ["active", "completed", "failed", "pending"],
            default: "pending",
        },
        payment_method: {
            type: String,
            required: true,
            enum: ["ck", "tm"],
            default: "ck",
        }
    },
    {
        timestamps: true,
        collection: COLLECTION_NAME
    }
);

module.exports = {
    billRepo: mongoose.model(DOCUMENT_NAME, BillSchema)
};
