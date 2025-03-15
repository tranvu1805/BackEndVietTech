const crypto = require("crypto");
const keyTokenModel = require("../models/keytoken.model");
const { getInfoData } = require("../utils");
const { createToKenPair } = require("../auth/authUtils");
const accountModel = require('../models/account.model'); 

class AccountService {
  static async getAccountWithRoleById(accountId) {
    try {
      // Tìm tài khoản theo ID và populate thông tin role
      const account = await accountModel
        .findById(accountId)
        .populate("role_id", "name") // Populate tên quyền (role name)
        .select("-password");

      if (!account) {
        return { code: 404, message: "Account not found!", status: "error" };
      }

      return {
        code: 200,
        message: "Account found!",
        status: "success",
        data: {
          ...account.toObject(),
          role: account.role_id ? account.role_id.name : "No role", // Trả về tên quyền của tài khoản
        },
      };
    } catch (error) {
      console.error("❌ Lỗi khi lấy tài khoản:", error);
      return { code: 500, message: "Internal Server Error", status: "error" };
    }
  }


  // ✅ Cập nhật thông tin tài khoản
  static async updateAccount(accountId, updateData) {
    try {
      console.log(
        "📌 Cập nhật tài khoản ID:",
        accountId,
        "Dữ liệu mới:",
        updateData
      );

      // Nếu có cập nhật mật khẩu, mã hóa lại trước khi lưu
      if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, 10);
      }

      // Cập nhật tài khoản
      const updatedAccount = await accountModel
        .findByIdAndUpdate(accountId, updateData, { new: true })
        .select("-password");
      if (!updatedAccount) {
        return { code: 404, message: "Account not found!", status: "error" };
      }

      return {
        code: 200,
        message: "Account updated successfully!",
        status: "success",
        data: updatedAccount,
      };
    } catch (error) {
      console.error("❌ Lỗi khi cập nhật tài khoản:", error);
      return { code: 500, message: "Internal Server Error", status: "error" };
    }
  }
  // ✅ Cập nhật trạng thái tài khoản
  static async updateAccountStatus(accountId, newStatus) {
    try {
      console.log(
        "📌 Bắt đầu cập nhật trạng thái tài khoản:",
        accountId,
        "=>",
        newStatus
      );

      // Kiểm tra trạng thái hợp lệ
      const validStatuses = ["active", "inactive", "banned"];
      if (!validStatuses.includes(newStatus)) {
        console.warn("⚠️ Trạng thái không hợp lệ:", newStatus);
        return { code: 400, message: "Invalid status!", status: "error" };
      }

      // Cập nhật trạng thái tài khoản
      const updatedAccount = await accountModel
        .findByIdAndUpdate(accountId, { status: newStatus }, { new: true })
        .select("-password");

      if (!updatedAccount) {
        console.warn("⚠️ Không tìm thấy tài khoản ID:", accountId);
        return { code: 404, message: "Account not found!", status: "error" };
      }

      console.log(
        "✅ Cập nhật trạng thái thành công! ID:",
        accountId,
        "Trạng thái mới:",
        newStatus
      );
      return {
        code: 200,
        message: "Account status updated successfully!",
        status: "success",
        data: updatedAccount,
      };
    } catch (error) {
      console.error("❌ Lỗi khi cập nhật trạng thái tài khoản:", error);
      return { code: 500, message: "Internal Server Error", status: "error" };
    }
  }
}

module.exports = AccountService;
