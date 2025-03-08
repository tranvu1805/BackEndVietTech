const AccountService = require("../services/account.service");
const mongoose = require("mongoose");

class AccountController {

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
    async updateAccountStatus(req, res) {
        const { id } = req.params;
        const { status } = req.body;

        const result = await AccountService.updateAccountStatus(id, status);
        return res.status(result.code).json(result);
    }
}


module.exports = new AccountController();
