const { model, Schema } = require("mongoose");
const slugify = require("slugify");

const DOCUMENT_NAME = 'Product'
const COLLECTION_NAME = 'Products'

const productSchema = new Schema({
    product_name: { type: String, required: true },
    product_thumbnail: { type: String, required: true },
    product_description: { type: String },
    product_price: { type: Number, required: true },
    product_stock: { type: Number, required: true },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true }, // Liên kết với bảng Category
    product_attributes: { type: Schema.Types.Mixed, required: true },

    product_ratingsAverage: {
        type: Number,
        default: 4.5, // Giá trị mặc định cho trung bình đánh giá
        min: [1, 'Rating must be above 1.0!'], // Đảm bảo đánh giá >= 1
        max: [5, 'Rating must be above 5.0!'], // Đảm bảo đánh giá <= 5
        set: (val) => Math.round(val * 10) / 10 // Làm tròn đến một chữ số thập phân
    },

    isDraft: { type: Boolean, default: true }, // Sản phẩm này có phải là bản nháp không?
    isPulished: { type: Boolean, default: false }, // Sản phẩm này có phải đã được xuất bản không?
    product_slug: String,
    variations: [
        {
            variant_name: { type: String, required: true },  // Tên biến thể (ví dụ: "Màu sắc")
            variant_value: { type: String, required: true }, // Giá trị của biến thể (ví dụ: "Đen", "128GB")
            price: { type: Number, required: true }, // Giá của biến thể này
            stock: { type: Number, required: true }, // Số lượng tồn kho của biến thể
            sku: { type: String, required: true, unique: true }, // Mã SKU duy nhất của biến thể
        }
    ]
}, { collection: COLLECTION_NAME, timestamps: true });

productSchema.pre('save', function (next) {
    // Kiểm tra nếu product_name có giá trị
    if (this.product_name && this.product_name.trim()) {
        this.product_slug = slugify(this.product_name, { lower: true, strict: true });
    } else {
        // Nếu product_name rỗng, gán slug mặc định hoặc xử lý lỗi
        this.product_slug = "default-slug"; // Hoặc có thể throw lỗi
    }
    next();
});

module.exports = model(DOCUMENT_NAME, productSchema);
