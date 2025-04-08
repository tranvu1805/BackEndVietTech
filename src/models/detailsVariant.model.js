const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const DOCUMENT_NAME = 'DetailsVariant'
const COLLECTION_NAME = 'DetailsVariants'

const DetailsVariantSchema = new Schema({
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    variantDetails: [
        {
            variantId: { type: Schema.Types.ObjectId, ref: 'Attribute', required: true },
            value: { type: String, required: true }
        }
    ],
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0 },
    stock: { type: Number, default: 0, min: 0 },
    sku: { type: String, required: true, unique: true }
}, { collection: COLLECTION_NAME, timestamps: true });

module.exports = mongoose.model(DOCUMENT_NAME, DetailsVariantSchema);
