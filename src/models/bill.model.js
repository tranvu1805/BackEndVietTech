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
        status: {
            type: String,
            required: true,
            enum: ["active", "completed", "failed", "pending"],
            default: "pending",
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
