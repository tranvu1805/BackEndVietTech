const { apiKey } = require("../auth/checkAuth");
const AccessService = require("../services/access.service");
const express = require("express");
const KeyTokenService = require("../services/keytoken.service");

class AccessController {

    // ✅ Đăng nhập tài khoản
    async login(req, res, next) {
        try {
            console.log(`[P]:: Login Request Received ::`, req.body);

            const result = await AccessService.login(req.body);

            if (result.status === "error") {
                console.warn(`⚠️ Login Failed: ${result.message}`);
            } else {
                console.log(`✅ Login Successful for User: ${result.metadata.account.username}`);
                console.log(`🔑 Access Token: ${result.metadata.tokens.accessToken}`);
            }

            return res.status(result.code).json(result);
        } catch (error) {
            console.error(`❌ Server Error during Login:`, error.message);
            return next(error);
        }
    };
    // ✅ Đăng ký tài khoản
    signUp = async (req, res) => {
        try {
            const result = await AccessService.signUp({ body: req.body });

            console.log("📥 Kết quả trả về từ signUp:", result); // Log kết quả từ service

            // Kiểm tra nếu result bị undefined hoặc không có code
            if (!result || !result.code) {
                return res.status(500).json({ message: "Unexpected error occurred!", status: "error" });
            }

            return res.status(result.code).json(result);
        } catch (error) {
            console.error("❌ Error in signUp:", error);
            return res.status(500).json({ message: "Internal Server Error", error: error.message });
        }
    };
    // ✅ Đăng ký tài khoản nhân viên (chỉ dành cho Admin)
    signUpEmployee = async (req, res) => {
        try {
            const result = await AccessService.signUpEmployee({ body: req.body });

            console.log("📥 Kết quả trả về từ signUp:", result); // Log kết quả từ service

            // Kiểm tra nếu result bị undefined hoặc không có code
            if (!result || !result.code) {
                return res.status(500).json({ message: "Unexpected error occurred!", status: "error" });
            }

            return res.status(result.code).json(result);
        } catch (error) {
            console.error("❌ Error in signUp:", error);
            return res.status(500).json({ message: "Internal Server Error", error: error.message });
        }
    };
    logout = async (req, res) => {
        try {
            const userId = req.body.userId || req.headers["x-user-id"];
            if (!userId) {
                return res.status(400).json({ message: "Bad Request: Missing user ID" });
            }

            await KeyTokenService.removeKeyToken(userId);
            (userId);
            return res.status(200).json({ message: "Logout successful" });
        } catch (error) {
            console.error("❌ [LOGOUT ERROR]:", error);
            return res.status(500).json({ message: "Internal Server Error" });
        }
    };


}

module.exports = new AccessController();
