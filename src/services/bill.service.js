"use strict";

const { NotFoundError } = require("../core/error.response");
const { billRepo } = require("../models/bill.model");

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
    const bills = await billRepo.find();
    return bills;
  }
  


}

module.exports = BillService;
