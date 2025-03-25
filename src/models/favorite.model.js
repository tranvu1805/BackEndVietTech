const { Schema, model } = require("mongoose");

const favoriteSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
}, { timestamps: true });

// Đảm bảo 1 user chỉ like 1 product 1 lần
favoriteSchema.index({ user: 1, product: 1 }, { unique: true });

module.exports = model("Favorite", favoriteSchema);
