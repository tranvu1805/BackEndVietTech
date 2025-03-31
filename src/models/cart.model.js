"use strict";

const { model, Schema, Types } = require("mongoose");

const DOCUMENT_NAME = "Cart";
const COLLECTION_NAME = "Carts";

// Schema cho sản phẩm trong giỏ hàng
const cartProductSchema = new Schema(
  {
    productId: {
      type: Types.ObjectId,
      ref: "Product", // Tham chiếu đến model Product
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    image: {
      type: String,
    },
    quantity: {
      type: Number,
      required: true,
      default: 1,
    },
    // Thông tin biến thể (nếu có)
    variant: {
      variantId: {
        type: Types.ObjectId,
      },
      variant_name: String,
      variant_value: String,
    },
  },
  { _id: false }
);

// Schema cho giỏ hàng
const cartSchema = new Schema(
  {
    cart_state: {
      type: String,
      required: true,
      enum: ["active", "completed", "failed", "pending"],
      default: "active",
    },
    cart_products: {
      type: [cartProductSchema], // Sử dụng schema con đã định nghĩa
      default: [],
    },
    cart_count_product: {
      type: Number,
      default: 0,
    },
    cart_userId: {
      type: Types.ObjectId,
      ref: "Account", // Tham chiếu đến model Account
      required: true,
    },
  },
  {
    collection: COLLECTION_NAME,
    timestamps: true,
  }
);

// Middleware để tự động cập nhật cart_count_product
cartSchema.pre("save", function (next) {
  if (this.cart_products) {
    this.cart_count_product = this.cart_products.length;
  }
  next();
});

//Export the model
module.exports = {
  cart: model(DOCUMENT_NAME, cartSchema),
};
