"use strict";

const express = require("express");
const DiscountController = require("../../controllers/disscount.controller");
const { asyncHandler } = require("../../auth/checkAuth");
const { authentication } = require("../../auth/authUtils");

const router = express.Router();

// router.use(authentication)

// Tạo mã giảm giá mới
router.post("/", asyncHandler(DiscountController.createDiscount));

router.get("/", asyncHandler(DiscountController.getAllDiscounts));

router.put("/:code", asyncHandler(DiscountController.updateDiscount));

router.delete("/:code", asyncHandler(DiscountController.deleteDiscount));   

// Kiểm tra mã giảm giá
router.post("/validate", asyncHandler(DiscountController.validateDiscount));




module.exports = router;
