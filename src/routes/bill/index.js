"use strict";

const express = require("express");
const BillController = require("../../controllers/bill.controller");
const { asyncHandler } = require("../../auth/checkAuth");
const { authentication } = require("../../auth/authUtils");
const router = express.Router();

router.get("/vnpay-return", asyncHandler(BillController.handleVnpayReturn));

router.use(authentication)
// Tính tổng doanh thu theo khoảng thời gian
router.get("/revenue", asyncHandler(BillController.getTotalRevenue));

// Lấy hóa đơn theo ID
router.get("/:billId", asyncHandler(BillController.getBillById));

router.put("/:billId/status", asyncHandler(BillController.updateBillStatus));

// Lấy tất cả hóa đơn
router.get("/", asyncHandler(BillController.getAllBills));

router.get('/status/:status', BillController.getBillsByStatus);

router.get("/user/:userId", asyncHandler(BillController.getBillsByUserId));







module.exports = router;
