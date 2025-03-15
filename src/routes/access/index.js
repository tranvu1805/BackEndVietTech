const express = require("express");
const accessController = require("../../controllers/access.controller");
const { apiKey } = require("../../auth/checkAuth");
const { authentication, verifyRefreshToken } = require("../../auth/authUtils");

const router = express.Router();
router.post("/staff/signup", apiKey, accessController.signUpEmployee);
router.post("/customer/signup", apiKey, accessController.signUp);

// Đăng nhập - kiểm tra Public Key
router.post("/login", apiKey, accessController.login);

// Đăng xuất - kiểm tra Refresh Token
router.post("/logout", verifyRefreshToken, accessController.logout);


module.exports = router;

