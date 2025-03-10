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
}

module.exports = BillController;
