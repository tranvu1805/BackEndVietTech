const { model, Schema } = require("mongoose");

const DOCUMENT_NAME = 'Product'
const COLLECTION_NAME = 'Products'

const productSchema = new Schema({
    product_name: { type: String, required: true },
    product_thumbnail: { type: String, required: true },
    product_description: { type: String },
    product_price: { type: Number, required: true },
    product_stock: { type: Number, required: true },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true }, // Liên kết với bảng Category
    product_attributes: { type: Schema.Types.Mixed, required: true }
}, { collection: COLLECTION_NAME, timestamps: true });

module.exports = model(DOCUMENT_NAME, productSchema);
