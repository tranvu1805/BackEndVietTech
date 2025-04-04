"use strict";

const categoryModel = require("../models/category.model");
const { discountRepo } = require("../models/disscount.model");
const productModel = require("../models/product.model");
const DiscountService = require("../services/disscount.service");

class DiscountController {
    static async createDiscount(req, res, next) {
        try {
            const data = req.body;
            const result = await DiscountService.createDiscount(data);
            return res.status(result.statusCode).json(result);
        } catch (error) {
            next(error);
        }
    }

    static async getAllDiscounts(req, res) {
        try {
            const response = await DiscountService.getAllDiscounts();
            return res.status(response.statusCode).json(response);
        } catch (error) {
            return res.status(500).json({ message: "Internal Server Error", error });
        }
    }

    static async updateDiscount(req, res) {
        try {
            const { code } = req.params;
            const updateData = req.body;
            const response = await DiscountService.updateDiscount(code, updateData);
            return res.status(response.statusCode).json(response);
        } catch (error) {
            return res.status(500).json({ message: "Internal Server Error", error });
        }
    }

    static async deleteDiscount(req, res) {
        try {
            const { code } = req.params;
            const response = await DiscountService.deleteDiscount(code);
            return res.status(response.statusCode).json(response);
        } catch (error) {
            return res.status(500).json({ message: "Internal Server Error", error });
        }
    }

    static async validateDiscount(req, res) {
        try {
            const { code } = req.body;
            if (!code) {
                return res.status(400).json({ message: "Discount code is required" });
            }
            const response = await DiscountService.validateDiscountCode(code);
            return res.status(response.statusCode).json(response);
        } catch (error) {
            return res.status(500).json({ message: "Internal Server Error", error });
        }
    }

    static async getDiscountListPage(req, res, next) {
        try {
            const { search, status, sort, page = 1, limit = 10 } = req.query;
            const filter = {};
            if (search) {
                filter.name = { $regex: search, $options: 'i' };
            }
            const now = new Date();
            if (status === "active") {
                filter.isDraft = false;
                filter.startDate = { $lte: now };
                filter.endDate = { $gte: now };
            } else if (status === "scheduled") {
                filter.isDraft = false;
                filter.startDate = { $gt: now };
            } else if (status === "expired") {
                filter.isDraft = false;
                filter.endDate = { $lt: now };
            } else if (status === "draft") {
                filter.isDraft = true;
            }

            const sortOptions = {
                discount_asc: { discountValue: 1 },
                discount_desc: { discountValue: -1 },
                start_date_asc: { startDate: 1 },
                start_date_desc: { startDate: -1 },
                end_date_asc: { endDate: 1 },
                name_asc: { name: 1 },
                name_desc: { name: -1 }
            };

            const sortQuery = sortOptions[sort] || { createdAt: -1 };
            const skip = (parseInt(page) - 1) * parseInt(limit);

            const [discounts, total] = await Promise.all([
                DiscountService.getDiscounts(filter, sortQuery, skip, limit),
                DiscountService.countDiscounts(filter)
            ]);

            const totalPages = Math.ceil(total / limit);



            res.render('admin/discount-list', {
                discounts,
                query: req.query,
                currentPage: parseInt(page),
                totalPages
            });
        } catch (error) {
            next(error);
        }
    }

    static async getCreateDiscountPage(req, res) {
        try {
            const products = await productModel.find().lean(); // hoặc lấy 1 phần sản phẩm thôi nếu nhiều
            const categories = await categoryModel.find().lean();

            res.render('admin/discount-form', {
                products,
                categories,
            });
        } catch (error) {
            console.error("Error render create page:", error);
            res.status(500).send("Lỗi khi load trang tạo khuyến mãi.");
        }
    }
}

module.exports = DiscountController;
