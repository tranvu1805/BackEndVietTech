"use strict";

const BillService = require("../services/bill.service");

class BillController {

  static async getBillById(req, res, next) {
    try {
      const { billId } = req.params;
      const bill = await BillService.getBillById({ billId });
      return res.status(200).json(bill);
    } catch (error) {
      next(error);
    }
  }

  static async updateBillStatus(req, res, next) {
    try {
      const { billId } = req.params;
      const { status } = req.body;

      const updatedBill = await BillService.updateBillStatus({ billId, status });

      return res.status(200).json({
        message: "Bill status updated successfully",
        statusCode: 200,
        metadata: updatedBill
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAllBills(req, res, next) {
    try {
      const bills = await BillService.getAllBills();
      return res.status(200).json({
        message: "Fetch all bills successfully",
        statusCode: 200,
        metadata: bills
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTotalRevenue(req, res) {
    try {
      const { startDate, endDate } = req.query;
      const result = await BillService.getTotalRevenue({ startDate, endDate });
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ message: "Internal Server Error", error });
    }
  }


}

module.exports = BillController;
