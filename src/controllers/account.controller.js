const AccountService = require("../services/account.service");
const mongoose = require("mongoose");

class AccountController {
    
    // ✅ Đăng ký tài khoản
     signUp = async (req, res) => {
        try {
            const result = await AccountService.signUp({ body: req.body });
    
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
            const result = await AccountService.signUpEmployee({ body: req.body });
    
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
    // ✅ Đăng nhập tài khoản
    async login(req, res, next) {
        try {
            console.log(`[P]:: Login Request Received ::`, req.body);
    
            const result = await AccountService.login(req.body);
    
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
    }
    
    // ✅ Lấy thông tin tài khoản theo ID
    async getAccount(req, res, next) {
        try {
            const { id } = req.params;
            console.log("📌 ID nhận từ request:", id);

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ message: "Invalid account ID!" });
            }

            const account = await AccountService.getAccountById(id);
            return res.status(account.code).json(account);
        } catch (error) {
            return next(error);
        }
    }

    // ✅ Cập nhật tài khoản theo ID
    async updateAccount(req, res, next) {
        try {
            const { id } = req.params;
            console.log("📌 ID nhận từ request:", id);
            console.log("🛠️ Dữ liệu cập nhật:", req.body);

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ message: "Invalid account ID!" });
            }

            const result = await AccountService.updateAccount(id, req.body);
            return res.status(result.code).json(result);
        } catch (error) {
            return next(error);
        }
    }
}

module.exports = new AccountController();
