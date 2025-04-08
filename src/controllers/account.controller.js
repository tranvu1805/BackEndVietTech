const AccountService = require("../services/account.service");
const mongoose = require("mongoose");
const moment = require("moment");
const Image = require("../models/image.model");

class AccountController {
  async getAllAccounts(req, res, next) {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        role = "Customer",
        status = ""
      } = req.query;

      const result = await AccountService.getAllAccounts(
        parseInt(page),
        parseInt(limit),
        search,
        role,
        status
      );

      return result.data; // ✅ Trả toàn bộ data, không chỉ accounts
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
  /** ✅ Đổi mật khẩu sau khi kiểm tra mật khẩu cũ */
  async changePassword(req, res, next) {
    try {
      const { accountId, oldPassword, newPassword } = req.body;

      if (!mongoose.Types.ObjectId.isValid(accountId)) {
        return res.status(400).json({ message: "ID tài khoản không hợp lệ!" });
      }
      if (!oldPassword || !newPassword) {
        return res.status(400).json({ message: "Thiếu mật khẩu cũ hoặc mới!" });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Mật khẩu mới phải có ít nhất 6 ký tự!" });
      }

      const result = await AccountService.changePassword(accountId, oldPassword, newPassword);
      return res.status(result.code).json(result);
    } catch (error) {
      return next(error);
    }
  }


  async adminUpdateAccount(req, res) {
    try {
      const accountId = req.params.id;
      const updateData = req.body;

      console.log("file Dtaa", req.file);
      

      // Nếu có ảnh → upload trước → tạo record image → gán ID vào profile_image
      if (req.file) {
        const image = new Image({
          file_name: req.file.originalname,
          file_path: req.file.path,
          file_size: req.file.size,
          file_type: req.file.mimetype,
          url: `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`,
        });

        await image.save();
        updateData.profile_image = image._id; // ⚠️ Gán ObjectId, không phải object
      }

      const result = await AccountService.updateAccount(accountId, updateData);

      return res.status(result.code).json({
        success: true,
        message: result.message,
        data: result.data
      });
    } catch (error) {
      return res.status(500).json({ message: "Server error", error: error.message });
    }
  }

}

module.exports = new AccountController();