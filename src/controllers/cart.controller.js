"use strict";

const CartService = require("../services/cart.service");
const { SuccessResponse, OK } = require("../core/success.response");
const { ErrorResponse } = require("../core/error.response");

class CartController {
  addToCart = async (req, res, next) => {
    const userId = req.user?.id || req.body.userId;
    const product = req.body;
    console.log("product", product);
    
    new SuccessResponse({
      message: "Cart created successfully",
      metadata: await CartService.addToCart({ userId, product }),
    }).send(res);
  };


  checkout = async (req, res, next) => {
    new SuccessResponse({
      message: "Cart checkout successfully",
      metadata: await CartService.checkout(req.body),
    }).send(res);
  };

  updateIsSelected = async (req, res, next) => {
    new SuccessResponse({
      message: "Product selection updated successfully",
      metadata: await CartService.updateIsSelected(req.body),
    }).send(res);
  };


  update = async (req, res, next) => {
    const userId = req.user?.id || req.body.userId;
    const product = req.body;

    new SuccessResponse({
      message: "Cart updated successfully",
      metadata: await CartService.updateUserCart({ userId, product }),
    }).send(res);
  };

  delete = async (req, res, next) => {
    const userId = req.user?.id || req.body.userId;
    const { productId, detailsVariantId } = req.body;

    console.log("productId", req.body);
    

    new SuccessResponse({
      message: "Cart deleted successfully",
      metadata: await CartService.deleteUserCart({
        userId,
        productId,
        variantId: detailsVariantId, // truyền dưới tên variantId cho service cũ nếu chưa refactor tên
      }),
    }).send(res);
  };


  listToCart = async (req, res, next) => {
    const { userId } = req.query;

    if (!userId) {
      return new ErrorResponse("userId is required", 400).send(res);
    }
    const result = await CartService.getListUserCart({ userId });
    new SuccessResponse({
      message: "Cart list successfully",
      metadata: result,
    }).send(res);
  };
}

module.exports = new CartController();
