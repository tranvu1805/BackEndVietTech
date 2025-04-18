
const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const DOCUMENT_NAME = 'Attribute'
const COLLECTION_NAME = 'Attributes'

const AttributeSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true, // ví dụ: "Màu sắc", "Kích thước"
        index: true
    },
    values: {
        type: [String], // ví dụ: ["Đỏ", "Xanh", "Vàng"]
        required: true
    },
    isDeleted: {
        type: Boolean,
        default: false // mặc định là chưa bị xóa
    },
}, { collection: COLLECTION_NAME, timestamps: true });

module.exports = mongoose.model(DOCUMENT_NAME, AttributeSchema);
