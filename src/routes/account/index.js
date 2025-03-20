const express = require("express");
const router = express.Router();
const AccountController = require("../../controllers/account.controller");
const { apiKey, permissions } = require("../../auth/checkAuth");

router.get("/:id", AccountController.getAccount); // Lấy thông tin tài khoản và quyền
router.put("/update/:id", AccountController.updateAccount);
router.put("/status/:id", AccountController.updateAccountStatus);
router.get("/statistics/:period", AccountController.getUserStatistics); // Lấy thống kê người dùng

module.exports = router;
