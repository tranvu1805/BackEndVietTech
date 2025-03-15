"use strict";

const express = require("express");
const DiscountController = require("../../controllers/disscount.controller");
const { asyncHandler } = require("../../auth/checkAuth");

const router = express.Router();

// Tạo mã giảm giá mới
router.post("/", asyncHandler(DiscountController.createDiscount));

router.get("/", asyncHandler(DiscountController.getAllDiscounts));

router.put("/:code", asyncHandler(DiscountController.updateDiscount));

router.delete("/:code", asyncHandler(DiscountController.deleteDiscount));



module.exports = router;
