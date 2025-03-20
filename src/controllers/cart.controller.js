"use strict";

const CartService = require("../services/cart.service");
const { SuccessResponse, OK } = require("../core/success.response");
const { ErrorResponse } = require("../core/error.response");

class CartController {
  addToCart = async (req, res, next) => {
    new SuccessResponse({
      message: "Cart created successfully",
      metadata: await CartService.addToCart(req.body),
    }).send(res);
  };

  checkout = async (req, res, next) => {
    new SuccessResponse({
      message: "Cart checkout successfully",
      metadata: await CartService.checkout(req.body),
    }).send(res);
  };

  update = async (req, res, next) => {
    new SuccessResponse({
      message: "Cart updated successfully",
      metadata: await CartService.updateUserCart(req.body),
    }).send(res);
  };
  delete = async (req, res, next) => {
    new SuccessResponse({
      message: "Cart deleted successfully",
      metadata: await CartService.deleteUserCart(req.body),
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
