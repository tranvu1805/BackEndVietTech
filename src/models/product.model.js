const { model, Schema } = require("mongoose");
const slugify = require("slugify");

const DOCUMENT_NAME = 'Product';
const COLLECTION_NAME = 'Products';

const productSchema = new Schema({
    product_name: { type: String, required: true },
    product_thumbnail: { type: String, required: true },
    product_description: { type: String },
    product_price: { type: Number, required: true }, // Giá cơ bản (có thể là giá thấp nhất)
    product_stock: { type: Number, required: true }, // Tổng tồn kho (có thể tính tự động)

    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    // product_attributes: { type: Schema.Types.Mixed, required: false },
    attributeIds: [{ type: Schema.Types.ObjectId, ref: "Attribute" }],

    product_ratingsAverage: {
        type: Number,
        default: 4.5,
        min: [1, 'Rating must be above 1.0!'],
        max: [5, 'Rating must be below 5.0!'],
        set: (val) => Math.round(val * 10) / 10
    },

    isDraft: { type: Boolean, default: true },
    isPulished: { type: Boolean, default: false },
    product_slug: String,

    image_ids: [{ type: Schema.Types.ObjectId, ref: 'Image' }]
}, {
    collection: COLLECTION_NAME,
    timestamps: true
});

productSchema.pre('save', function (next) {
    if (this.product_name && this.product_name.trim()) {
        this.product_slug = slugify(this.product_name, { lower: true, strict: true });
    } else {
        this.product_slug = "default-slug";
    }
    next();
});

module.exports = model(DOCUMENT_NAME, productSchema);
