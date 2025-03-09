"use strict";

const {
  ConflictRequestError,
  NotFoundError,
} = require("../core/error.response");
const { cart } = require("../models/cart.model");
class CartService {
  //Start Repo

  //Tạo mới giỏ hàng hoặc cập nhật giỏ hàng
  static async createUserCart({ userId, product }) {
    const query = { cart_userId: userId, cart_state: "active" },
      updateOrInsert = {
        $addToSet: { cart_products: product },
      },
      options = { upsert: true, new: true };
    return await cart.findOneAndUpdate(query, updateOrInsert, options);
  }

  //Check sản phẩm có trong giỏ hàng hay chưa
  static async checkProductInCart({ userId, productId }) {
    return await cart.findOne({
      cart_userId: userId,
      cart_state: "active",
      "cart_products.productId": productId,
    });
  }

  //Cập nhật số lượng sản phẩm trong giỏ hàng
  static async updateUserCartQuantity({ userId, product }) {
    const { productId, quantity } = product;
    const query = {
        cart_userId: userId,
        cart_state: "active",
        "cart_products.productId": productId,
      },
      updateSet = {
        $inc: {
          "cart_products.$.quantity": quantity,
        },
      },
      options = { upsert: true, new: true };
    return await cart.findOneAndUpdate(query, updateSet, options);
  }

  //End Repo

  static async addToCart({ userId, product = {} }) {
    const productInCart = await CartService.checkProductInCart({
      userId,
      productId: product.productId,
    });

    if (productInCart) {
      return await CartService.updateUserCartQuantity({ userId, product });
    }
    const userCart = await cart.findOne({ cart_userId: userId });
    if (!userCart) {
      return await CartService.createUserCart({ userId, product });
    }

    if (!userCart.cart_products.length) {
      userCart.cart_products = [product];
      return await userCart.save();
    }

    return await CartService.createUserCart({ userId, product });
  }

  //update cart
  static async updateUserCart({ userId, product }) {
    const { productId, quantity } = product;
    const query = {
        cart_userId: userId,
        cart_state: "active",
        "cart_products.productId": productId,
      },
      updateSet = {
        $set: {
          "cart_products.$.quantity": quantity,
        },
      },
      options = { upsert: true, new: true };
    return await cart.findOneAndUpdate(query, updateSet, options);
  }
  //delete cart
  static async deleteUserCart({ userId, productId }) {
    const query = {
        cart_userId: userId,
        cart_state: "active",
      },
      updateSet = {
        $pull: {
          cart_products: { productId },
        },
      };

    const deleteCart = await cart.updateOne(query, updateSet);
    return deleteCart;
  }

  //get cart
  static async getListUserCart({ userId }) {
    return await cart.findOne({ cart_userId: userId }).lean();
  }
}
module.exports = CartService;
