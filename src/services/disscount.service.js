"use strict";

const categoryModel = require("../models/category.model");
const { discountRepo } = require("../models/disscount.model");
const { getCategoriesWithProductCount } = require("./category.service");
const mongoose = require("mongoose");

class DiscountService {

  static async createDiscount(data) {
    const { code } = data;

    const existingDiscount = await discountRepo.findOne({ code });
    if (existingDiscount) {
      return {
        statusCode: 400,
        message: "Discount code already exists",
        status: "error",
      };
    }

    const newDiscount = await discountRepo.create(data);

    return {
      message: "Discount code created successfully",
      statusCode: 201,
      metadata: newDiscount,
    };
  }

  static async getAllDiscounts() {
    const discounts = await discountRepo.find({})
      .populate("appliedProducts")
      .populate("appliedCategories")
      .lean();

    return {
      message: "Fetched all discount codes successfully",
      statusCode: 200,
      metadata: discounts,
    };
  }

  static async updateDiscount(oldCode, updateData) {
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
        statusCode: 404,
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

  static async validateDiscountCode(code) {
    const discount = await discountRepo.findOne({ code });

    if (!discount) {
      return {
        statusCode: 404,
        message: "Discount code not found",
        status: "error",
      };
    }

    const now = new Date();
    if (discount.isDraft || now < discount.startDate || now > discount.endDate) {
      return {
        statusCode: 400,
        message: "Discount code is not active",
        status: "error",
      };
    }

    return {
      message: "Discount code is valid",
      statusCode: 200,
      metadata: discount,
    };
  }

  static async getDiscounts(filter, sort, skip, limit) {
    const discounts = await discountRepo.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate("appliedProducts")
      .lean();

    for (let discount of discounts) {
      if (discount.appliedCategories && discount.appliedCategories.length > 0) {
        const categoryIds = discount.appliedCategories.map(id => new mongoose.Types.ObjectId(id));
        const categories = await categoryModel.aggregate([
          { $match: { _id: { $in: categoryIds } } },
          {
            $lookup: {
              from: 'Products',
              localField: '_id',
              foreignField: 'category',
              as: 'Products'
            }
          },
          {
            $addFields: {
              productCount: { $size: '$Products' }
            }
          },
          { $project: { products: 0 } }
        ]);

        discount.appliedCategories = categories;
      }
    }

    return discounts;
  }

  static async countDiscounts(filter) {
    return discountRepo.countDocuments(filter);
  }
}

module.exports = DiscountService;
