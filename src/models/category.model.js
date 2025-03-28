const { model, Schema } = require("mongoose");

const categorySchema = new Schema({
    name: { type: String, required: true, unique: true },
    parent_category: { type: Schema.Types.ObjectId, ref: "Category", default: null },
    attributes_template: { type: [String], required: true },
    thumbnail: { type: String, default: "" } // Đường dẫn hoặc URL ảnh biểu tượng
}, { timestamps: true });

module.exports = model("Category", categorySchema);
