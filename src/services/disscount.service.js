"use strict";

const categoryModel = require("../models/category.model");
const { discountRepo } = require("../models/disscount.model");
const { getCategoriesWithProductCount } = require("./category.service");
const mongoose = require("mongoose");

class DiscountService {

  static async createDiscount(data) {
    // Chuẩn hóa input từ form HTML
    const cleanedData = {
      ...data,
      isDraft: data.isDraft === "on",
      discountValue: Number(data.discountValue),
      maxDiscountAmount: data.maxDiscountAmount ? Number(data.maxDiscountAmount) : undefined,
      minOrderValue: data.minOrderValue ? Number(data.minOrderValue) : undefined,
      usageLimit: data.usageLimit ? Number(data.usageLimit) : undefined,
      appliedProducts: Array.isArray(data.appliedProducts)
        ? data.appliedProducts
        : data.appliedProducts ? [data.appliedProducts] : [],
      appliedCategories: Array.isArray(data.appliedCategories)
        ? data.appliedCategories
        : data.appliedCategories ? [data.appliedCategories] : [],
    };

    const { code } = cleanedData;

    if (code) {
      const existingDiscount = await discountRepo.findOne({ code });
      if (existingDiscount) {
        return {
          statusCode: 400,
          message: "Mã khuyến mãi đã tồn tại",
          status: "error",
        };
      }
    }

    const newDiscount = await discountRepo.create(cleanedData);

    return {
      message: "Tạo mã khuyến mãi thành công",
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

  static async updateDiscount(discountId, updateData) {
    const currentDiscount = await discountRepo.findById(discountId);

    if (!currentDiscount) {
      return {
        statusCode: 404,
        message: "Không tìm thấy khuyến mãi",
        status: "error",
      };
    }

    // Nếu mã code được cập nhật
    if (updateData.code && updateData.code !== currentDiscount.code) {
      const existingDiscount = await discountRepo.findOne({
        code: updateData.code,
        _id: { $ne: discountId }
      });

      if (existingDiscount) {
        return {
          statusCode: 400,
          message: "Mã giảm giá đã tồn tại",
          status: "error",
        };
      }
    }

    // Giả sử discount đã được áp dụng thì không cho sửa code hoặc giá trị giảm
    const hasBeenUsed = currentDiscount.usageCount > 0;
    const sensitiveFields = ['code', 'discountValue', 'discountType'];

    if (hasBeenUsed) {
      for (const field of sensitiveFields) {
        if (
          updateData[field] !== undefined &&
          updateData[field] !== currentDiscount[field]
        ) {
          return {
            statusCode: 400,
            message: `Không thể thay đổi trường '${field}' vì mã khuyến mãi đã được sử dụng.`,
            status: "error",
          };
        }
      }
    }

    const updatedDiscount = await discountRepo.findByIdAndUpdate(
      discountId,
      { $set: updateData },
      { new: true }
    );

    return {
      message: "Cập nhật khuyến mãi thành công",
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
