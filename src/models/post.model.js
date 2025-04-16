const { model, Schema, Types } = require("mongoose");

const DOCUMENT_NAME = "Post";
const COLLECTION_NAME = "Posts";

const postSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    content: {
      type: String,
      required: true,
    },
    meta_description: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["publish", "draft", "canceled"],
      default: "publish",
    },
    account_id: {
      type: Types.ObjectId,
      required: true,
      ref: "account",
    },

    // Ảnh đại diện và bộ ảnh
    thumbnail: {
      type: Types.ObjectId,
      ref: "Image",
      default: null,
    },
    images: [{
      type: Types.ObjectId,
      ref: "Image"
    }],


    // Tag, danh mục và liên kết sản phẩm
    tags: {
      type: [String],
      default: [],
    },
    category_id: {
      type: Types.ObjectId,
      ref: "Category",
    },
    related_products: {
      type: [Types.ObjectId],
      ref: "Product",
      default: [],
    },
  },
  {
    collection: COLLECTION_NAME,
    timestamps: true,
  }
);

module.exports = {
  post: model(DOCUMENT_NAME, postSchema),
};
