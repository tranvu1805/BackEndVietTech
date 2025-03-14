const express = require("express");
const router = express.Router();
const AccountController = require("../../controllers/account.controller");
const { apiKey, permissions } = require("../../auth/checkAuth");

router.get("/:id", AccountController.getAccount); // Lấy thông tin tài khoản và quyền
router.put("/update/:id", AccountController.updateAccount);
router.put("/status/:id", AccountController.updateAccountStatus);

module.exports = router;
