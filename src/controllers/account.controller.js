const AccountService = require("../services/account.service");
const mongoose = require("mongoose");

class AccountController {
    
    // ✅ Đăng ký tài khoản
    async signUp(req, res, next) {
        try {
            console.log(`[📥 REQUEST]:: signUp::`, req.body);
    
            const result = await AccountService.signUp(req.body);
            console.log(`[📤 RESPONSE]::`, result);  // Kiểm tra response từ service
    
            return res.status(result.code).json(result);
        } catch (error) {
            console.error(`❌ Error in signUp:`, error);
            return next(error);
        }
    }
    

    // ✅ Đăng nhập tài khoản
    async login(req, res, next) {
        try {
            console.log(`[P]:: login::`, req.body);

            const result = await AccountService.login(req.body);
            return res.status(result.code).json(result);
        } catch (error) {
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
