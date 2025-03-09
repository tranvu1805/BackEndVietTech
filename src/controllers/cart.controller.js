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

  //chưa xong
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
    // Validate query parameters here
    if (!req.query) return ErrorResponse("userId is required");
    new SuccessResponse({
      message: "Cart list successfully",
      metadata: await CartService.getListUserCart(req.query),
    }).send(res);
  };
}

module.exports = new CartController();
