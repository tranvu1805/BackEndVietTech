const express = require("express");
const router = express.Router();
const AccountController = require("../../controllers/account.controller");
const {authentication}=require("../../auth/authUtils")
const { apiKey, permissions } = require("../../auth/checkAuth");

router.get("/:id", AccountController.getAccount); // Lấy thông tin tài khoản và quyền
router.get("/statistics/:period", AccountController.getUserStatistics); // Lấy thống kê người dùng

router.use(authentication)

router.put("/update/:id", AccountController.updateAccount);
router.put("/status/:id", AccountController.updateAccountStatus);

module.exports = router;
