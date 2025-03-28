const AccountService = require("../services/account.service");
const mongoose = require("mongoose");
const moment = require("moment");

class AccountController {
  async getAllAccounts(req, res, next) {
    try {
        const { page = 1, limit = 10 } = req.query;
        const result = await AccountService.getAllAccounts(parseInt(page), parseInt(limit));
        return res.status(result.code).json(result);
    } catch (error) {
        return next(error);
    }
}

  async getAccount(req, res, next) {
    try {
      const { id } = req.params;  // Lấy id từ tham số của request

      // Kiểm tra nếu id không hợp lệ
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid account ID!" });
      }

      const account = await AccountService.getAccountWithRoleById(id);
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
  async getUserStatistics(req, res) {
    try {
      const { period } = req.params;
      const result = await AccountService.getUserStatistics(period);
      if (result.data.previousCount === 0) {
        result.data.percentageChange = "100%";
    }
      return res.status(result.code).json(result);
    } catch (error) {
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }
   /** ✅ Xử lý quên mật khẩu */
   async forgotPasswordHandler(req, res) {
    try {
      await AccountService.forgotPasswordHandler(req, res);
    } catch (error) {
      return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
  }
}

module.exports = new AccountController();