const mongoose = require("mongoose");

const DOCUMENT_NAME = "review";
const COLLECTION_NAME = "reviews";

const ReviewSchema = new mongoose.Schema(
  {
    account_id: { type: mongoose.Schema.Types.ObjectId, ref: "account", required: true },
    product_id: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    contents_review: { type: String, required: true }
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME
  }
);

module.exports = mongoose.model(DOCUMENT_NAME, ReviewSchema);
