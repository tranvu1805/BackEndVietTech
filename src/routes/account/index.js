const express = require("express");
const router = express.Router();
const AccountController = require("../../controllers/account.controller");
const { authentication } = require("../../auth/authUtils")
const { apiKey, permissions } = require("../../auth/checkAuth");

router.get("/getAll", AccountController.getAllAccounts); // Lấy tất cả người dùng
router.get("/:id", AccountController.getAccount); // Lấy thông tin tài khoản và quyền
router.get("/statistics/:period", AccountController.getUserStatistics); // Lấy thống kê người dùng
router.post('/forgot-password', AccountController.forgotPasswordHandler);

router.use(authentication)

router.put("/update/:id", AccountController.updateAccount);
router.put("/status/:id", AccountController.updateAccountStatus);
// ✅ API đổi mật khẩu (cần xác thực)
router.post("/change-password", AccountController.changePassword);

module.exports = router;
