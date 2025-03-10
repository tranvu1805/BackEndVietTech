"use strict";

const express = require("express");
const BillController = require("../../controllers/bill.controller");
const { asyncHandler } = require("../../auth/checkAuth");
const router = express.Router();

// Lấy hóa đơn theo ID
router.get("/:billId", asyncHandler(BillController.getBillById));

module.exports = router;
