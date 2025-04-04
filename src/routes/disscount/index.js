"use strict";

const express = require("express");
const DiscountController = require("../../controllers/disscount.controller");
const { asyncHandler } = require("../../auth/checkAuth");
const { authentication } = require("../../auth/authUtils");

const router = express.Router();

// Nếu cần xác thực thì bật middleware này
// router.use(authentication);

// Lấy danh sách hiển thị theo trang (cho màn quản trị)
router.get("/list", asyncHandler(DiscountController.getDiscountListPage));

// ✅ API tạo mới
router.post("/", asyncHandler(DiscountController.createDiscount));

// ✅ API lấy toàn bộ discount (raw json, dùng cho dashboard hoặc kiểm thử)
router.get("/", asyncHandler(DiscountController.getAllDiscounts));

// ✅ Cập nhật theo code
router.put("/:code", asyncHandler(DiscountController.updateDiscount));

// ✅ Xóa discount theo code
router.delete("/:code", asyncHandler(DiscountController.deleteDiscount));

// ✅ Kiểm tra mã hợp lệ (áp dụng khi khách hàng nhập mã giảm giá)
router.post("/validate", asyncHandler(DiscountController.validateDiscount));

// ❗ (Optional) Tạo thêm route xuất file Excel nếu bạn có logic export:
// router.get("/export", asyncHandler(DiscountController.exportDiscounts));





module.exports = router;
