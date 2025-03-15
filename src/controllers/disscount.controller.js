"use strict";

const DiscountService = require("../services/disscount.service");

class DiscountController {
    static async createDiscount(req, res, next) {
        try {
            const { code, discount_amount, min_order_value, expiration_date, is_active } = req.body;
            const result = await DiscountService.createDiscount({
                code,
                discount_amount,
                min_order_value,
                expiration_date,
                is_active,
            });
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

     // 📝 Cập nhật mã giảm giá
     static async updateDiscount(req, res) {
        try {
            const { code } = req.params; // Lấy code từ URL
            const updateData = req.body; // Dữ liệu cần cập nhật
            const response = await DiscountService.updateDiscount(code, updateData);
            return res.status(response.statusCode).json(response);
        } catch (error) {
            return res.status(500).json({ message: "Internal Server Error", error });
        }
    }

    // 🗑️ Xóa mã giảm giá
    static async deleteDiscount(req, res) {
        try {
            const { code } = req.params; // Lấy code từ URL
            const response = await DiscountService.deleteDiscount(code);
            return res.status(response.statusCode).json(response);
        } catch (error) {
            return res.status(500).json({ message: "Internal Server Error", error });
        }
    }   

}

module.exports = DiscountController;
