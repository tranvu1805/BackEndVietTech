const crypto = require("crypto");
const bcrypt = require("bcrypt");
const accountModel = require("../models/account.model");
const moment = require("moment");
const Image = require("../models/image.model");

class AccountService {
  /** Lấy tài khoản và role theo ID */
  static async getAccountWithRoleById(accountId) {
    try {
      if (!accountId) throw new Error("Account ID is required");
      
      const account = await accountModel
        .findById(accountId)
        .populate("role_id", "name")
        .populate("profile_image")
        .select("-password");
      
      if (!account) return { code: 404, message: "Account not found!", status: "error" };
      
      return {
        code: 200,
        message: "Account found!",
        status: "success",
        data: { ...account.toObject(), role: account.role_id?.name || "No role" },
      };
    } catch (error) {
      console.error("❌ Error fetching account:", error);
      return { code: 500, message: error.message || "Internal Server Error", status: "error" };
    }
  }

  /** Cập nhật tài khoản */
  static async updateAccount(accountId, updateData) {
    try {
      if (!accountId || !updateData) throw new Error("Invalid input");

      console.log("📌 Updating account:", accountId, updateData);

      if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, 10);
      }
      
      const existingAccount = await accountModel.findById(accountId);
      if (!existingAccount) return { code: 404, message: "Account not found!", status: "error" };
      
      if (updateData.phone) {
        const phoneExists = await accountModel.findOne({ phone: updateData.phone, _id: { $ne: accountId } });
        if (phoneExists) throw new Error("Phone number already in use");
      }

      const updatedAccount = await accountModel.findByIdAndUpdate(accountId, updateData, { new: true }).select("-password");
      return { code: 200, message: "Account updated successfully!", status: "success", data: updatedAccount };
    } catch (error) {
      console.error("❌ Error updating account:", error);
      return { code: 500, message: error.message || "Internal Server Error", status: "error" };
    }
  }

  /** Cập nhật trạng thái tài khoản */
  static async updateAccountStatus(accountId, newStatus) {
    try {
      if (!accountId || !newStatus) throw new Error("Invalid input");
      const validStatuses = ["active", "inactive", "banned"];
      if (!validStatuses.includes(newStatus)) throw new Error("Invalid status!");
      
      const updatedAccount = await accountModel.findByIdAndUpdate(accountId, { status: newStatus }, { new: true }).select("-password");
      if (!updatedAccount) return { code: 404, message: "Account not found!", status: "error" };
      
      return { code: 200, message: "Account status updated successfully!", status: "success", data: updatedAccount };
    } catch (error) {
      console.error("❌ Error updating account status:", error);
      return { code: 500, message: error.message || "Internal Server Error", status: "error" };
    }
  }

  /** Thống kê số lượng người dùng mới theo tuần, tháng, năm */
  static async getUserStatistics(period) {
    try {
      if (!period) throw new Error("Period is required");
      const validPeriods = ["week", "month", "year"];
      if (!validPeriods.includes(period)) throw new Error("Invalid period!");

      let startDate, prevStartDate, prevEndDate;
      const today = moment().endOf("day");

      switch (period) {
        case "week":
          startDate = moment().startOf("isoWeek");
          prevStartDate = moment().subtract(1, "weeks").startOf("isoWeek");
          prevEndDate = moment().subtract(1, "weeks").endOf("isoWeek");
          break;
        case "month":
          startDate = moment().startOf("month");
          prevStartDate = moment().subtract(1, "months").startOf("month");
          prevEndDate = moment().subtract(1, "months").endOf("month");
          break;
        case "year":
          startDate = moment().startOf("year");
          prevStartDate = moment().subtract(1, "years").startOf("year");
          prevEndDate = moment().subtract(1, "years").endOf("year");
          break;
      }
      
      const currentCount = await accountModel.countDocuments({ createdAt: { $gte: startDate, $lte: today } });
      const previousCount = await accountModel.countDocuments({ createdAt: { $gte: prevStartDate, $lte: prevEndDate } });
      
      const percentageChange = previousCount === 0 ? "N/A" : (((currentCount - previousCount) / previousCount) * 100).toFixed(2) + "%";

      return {
        code: 200,
        message: "User statistics fetched successfully!",
        status: "success",
        data: { period, currentCount, previousCount, percentageChange },
      };
    } catch (error) {
      console.error("❌ Error fetching user statistics:", error);
      return { code: 500, message: error.message || "Internal Server Error", status: "error" };
    }
  }
}

module.exports = AccountService;