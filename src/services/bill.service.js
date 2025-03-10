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
}

module.exports = BillService;
