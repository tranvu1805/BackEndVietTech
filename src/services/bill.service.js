"use strict";

const { NotFoundError } = require("../core/error.response");
const { billRepo } = require("../models/bill.model");
const productModel = require("../models/product.model");

class BillService {
  static async getBillById({ billId }) {
    const bill = await billRepo.findById(billId);
    if (!bill) {
      throw new NotFoundError("Bill not found");
    }
    return bill;
  }

  static async updateBillStatus({ billId, status }) {
    const validStatuses = ["active", "completed", "failed", "pending"];

    // Kiểm tra xem status có hợp lệ không
    if (!validStatuses.includes(status)) {
      return {
        code: 400,
        message: "Invalid status",
        status: "error",
      };
    }

    // Tìm và cập nhật trạng thái đơn hàng
    const updatedBill = await billRepo.findByIdAndUpdate(
      billId,
      { status },
      { new: true } // Trả về dữ liệu sau khi cập nhật
    );

    if (!updatedBill) {
      throw new NotFoundError("Bill not found");
    }

    return updatedBill;
  }

  static async getAllBills() {
    const bills = await billRepo.find().lean(); // thêm lean() để dễ thao tác dữ liệu

    // Lặp từng bill
    for (const bill of bills) {
      // Lặp từng sản phẩm trong bill
      for (const product of bill.products) {
        const productDoc = await productModel.findById(product.productId).lean();
        if (productDoc) {
          product.product_name = productDoc.product_name;
        } else {
          product.product_name = "Sản phẩm không tồn tại";
        }
      }
    }

    return bills;
  }

  static async getAllBillForAdmin(filter = {}, skip = 0, limit = 10) {
    const [bills, totalItems] = await Promise.all([
      billRepo.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }).lean(),
      billRepo.countDocuments(filter)
    ]);

    for (const bill of bills) {
      for (const product of bill.products) {
        const productDoc = await productModel.findById(product.productId).lean();
        product.product_name = productDoc ? productDoc.product_name : "Sản phẩm không tồn tại";
      }
    }

    const totalPages = Math.ceil(totalItems / limit);
    const currentPage = Math.floor(skip / limit) + 1;

    return { bills, totalItems, totalPages, currentPage };
  }


  static async getTotalRevenue({ startDate, endDate }) {
    try {

      if (!startDate || !endDate) {
        return {
          message: "Thiếu thông tin ngày bắt đầu hoặc ngày kết thúc",
          totalRevenue: 0
        };
      }

      // Chuyển startDate về đầu ngày (00:00:00)
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      // Chuyển endDate về cuối ngày (23:59:59)
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      const result = await billRepo.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: null, totalRevenue: { $sum: "$total" } } }
      ]);


      return {
        message: "Lấy tổng doanh thu thành công",
        totalRevenue: result.length > 0 ? result[0].totalRevenue : 0
      };

    } catch (error) {
      return {
        message: "Internal Server Error",
        error: error.message || "Lỗi không xác định",
        totalRevenue: 0
      };
    }
  }



}

module.exports = BillService;
