"use strict";

const { discountRepo } = require("../models/disscount.model");

class DiscountService {

  static async createDiscount({ code, discount_amount, min_order_value, expiration_date, is_active }) {
    const existingDiscount = await discountRepo.findOne({ code });
    if (existingDiscount) {
      return {
        statusCode: 400,
        message: "Discount code already exists",
        status: "error",
      };
    }

    const newDiscount = await discountRepo.create({
      code,
      discount_amount,
      min_order_value,
      expiration_date,
      is_active: is_active ?? true, // Mặc định là true nếu không truyền
    });

    return {
      message: "Discount code created successfully",
      statusCode: 201,
      metadata: newDiscount,
    };
  }

  static async getAllDiscounts() {
    const discounts = await discountRepo.find({});
    return {
      message: "Fetched all discount codes successfully",
      statusCode: 200,
      metadata: discounts,
    };
  }

  // Cập nhật mã giảm giá
  static async updateDiscount(oldCode, updateData) {
    //đảm bảo code mới không trùng
    if (updateData.code) {
      const existingDiscount = await discountRepo.findOne({ code: updateData.code });
      if (existingDiscount && existingDiscount.code !== oldCode) {
        return {
          statusCode: 400,
          message: "Discount code already exists",
          status: "error",
        };
      }
    }

    const updatedDiscount = await discountRepo.findOneAndUpdate(
      { code: oldCode },
      { $set: updateData },
      { new: true }
    );

    if (!updatedDiscount) {
      return {
        code: 404,
        message: "Discount code not found",
        status: "error",
      };
    }

    return {
      message: "Discount updated successfully",
      statusCode: 200,
      metadata: updatedDiscount,
    };
  }

  // Xóa mã giảm giá
  static async deleteDiscount(code) {
    const discount = await discountRepo.findOneAndDelete({ code });

    if (!discount) {
      return {
        statusCode: 404,
        message: "Discount code not found",
        status: "error",
      };
    }

    return {
      message: "Discount code deleted successfully",
      statusCode: 200,
      metadata: discount,
    };
  }

}

module.exports = DiscountService;
