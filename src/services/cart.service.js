"use strict";

const {
  ConflictRequestError,
  NotFoundError,
} = require("../core/error.response");
const { cart } = require("../models/cart.model");
const { billRepo } = require("../models/bill.model");
const { discountRepo } = require("../models/disscount.model");
const productModel= require("../models/product.model");
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

  // thanh toán
  static async checkout({
    userId,
    address,
    phone_number,
    receiver_name,
    payment_method,
    discount_code,
  }) {
    const currentCart = await cart.findOne({
      cart_userId: userId,
      cart_state: "active",
    });
    if (!currentCart) {
      return {
        code: 400,
        message: "Cart not found",
        status: "error",
      };
    }

    if (!currentCart.cart_products || currentCart.cart_products.length === 0) {
      return {
        code: 400,
        message: "Cart is empty. Cannot proceed to checkout.",
        status: "error",
      };
    }

    let total = 0;
    const bulkUpdateOps = [];

    // currentCart.cart_products.forEach((e) => (total += e.price * e.quantity));
    for (const item of currentCart.cart_products) {
      console.log("🔹 productModel:", productModel);
      const product = await productModel.findById(item.productId);

      if (!product) {
        return {
          code: 404,
          message: `Product with ID ${item.productId} not found`,
          status: "error",
        };
      }

      if (product.product_stock < item.quantity) {
        return {
          code: 400,
          message: `Not enough stock for product ${product.product_name}`,
          status: "error",
        };
      }

      console.log(
        `🔹 Trước khi cập nhật: ${product.product_name} (Stock: ${product.product_stock})`
      );

      // Giảm số lượng tồn kho
      bulkUpdateOps.push({
        updateOne: {
          filter: { _id: item.productId },
          update: { $inc: { product_stock: -item.quantity } },
        },
      });

      total += item.price * item.quantity;
    }

    // Cập nhật tồn kho của tất cả sản phẩm cùng lúc
    if (bulkUpdateOps.length > 0) {
      await productModel.bulkWrite(bulkUpdateOps);
    }

     // Kiểm tra lại stock sau khi cập nhật
  for (const item of currentCart.cart_products) {
    const updatedProduct = await productModel.findById(item.productId);
    console.log(
      `✅ Sau khi cập nhật: ${updatedProduct.product_name} (Stock: ${updatedProduct.product_stock})`
    );
  }

    const shippingFee = 35;
    total += shippingFee;

    // Kiểm tra mã giảm giá
    let discountAmount = 0;
    let discount = null;

    if (discount_code) {
      discount = await discountRepo.findOne({
        code: discount_code,
        is_active: true,
        expiration_date: { $gte: new Date() }, // Kiểm tra chưa hết hạn
      });

      if (discount) {
        discountAmount = discount.discount_amount;
      }
    }

    total -= discountAmount; // Trừ vào tổng tiền

    // Sinh mã đơn hàng ngẫu nhiên 5 chữ số
    const orderCode = Math.floor(10000 + Math.random() * 90000);

    const newBill = await billRepo.create({
      user_id: currentCart.cart_userId,
      products: currentCart.cart_products,
      order_code: orderCode,
      address: address,
      total: total,
      shipping_fee: shippingFee,
      phone_number: phone_number,
      receiver_name: receiver_name,
      status: "pending",
      payment_method: payment_method || "tm",
      discount_code: discount_code || null,
      discount_amount: discountAmount || 0, // Số tiền đã giảm
    });

    // await currentCart.deleteOne()
    return newBill;
  }

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

    if (quantity === 0) {
      return await this.deleteUserCart({ userId, productId });
    }
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
