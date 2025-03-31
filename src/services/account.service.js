const crypto = require("crypto");
const bcrypt = require("bcrypt");
const accountModel = require("../models/account.model");
const moment = require("moment");
const Image = require("../models/image.model");
const nodemailer = require("nodemailer");

// Lưu trữ OTP tạm thời
const otpStore = new Map();

// Cấu hình gửi email
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});
class AccountService {
  /** Lấy tất cả tài khoản với hỗ trợ phân trang */
  static async getAllAccounts(page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;
      const accounts = await accountModel
        .find()
        .populate("role_id", "name")
        .populate("profile_image")
        .select("-password")
        .skip(skip)
        .limit(limit);

      const totalAccounts = await accountModel.countDocuments();

      return {
        code: 200,
        message: "Accounts fetched successfully!",
        status: "success",
        data: { accounts, totalAccounts, page, totalPages: Math.ceil(totalAccounts / limit) },
      };
    } catch (error) {
      console.error("❌ Error fetching accounts:", error);
      return { code: 500, message: error.message || "Internal Server Error 2", status: "error" };
    }
  }
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
  /** Xử lý quên mật khẩu - Gửi OTP hoặc xác minh OTP để đổi mật khẩu */
  static async forgotPasswordHandler(req, res) {
    try {
      const { email, otp, newPassword } = req.body;

      // Kiểm tra xem email có tồn tại không
      const user = await accountModel.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: "Email không tồn tại trong hệ thống!" });
      }

      // Nếu không có OTP & mật khẩu => Gửi OTP
      if (!otp && !newPassword) {
        const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
        otpStore.set(email, { otp: generatedOtp, expires: Date.now() + 5 * 60 * 1000 });

        // Gửi OTP qua email
        await transporter.sendMail({
          from: process.env.SMTP_USER,
          to: email,
          subject: "VietTech OTP Reset Pass",
          text: `Mã OTP của bạn là ${generatedOtp}. Mã có hiệu lực trong 5 phút.`,
        });

        return res.json({ message: "OTP đã được gửi thành công!" });
      }

      // Nếu có OTP & mật khẩu => Kiểm tra OTP & đổi mật khẩu
      const storedOTP = otpStore.get(email);
      if (!storedOTP || storedOTP.otp !== otp || storedOTP.expires < Date.now()) {
        return res.status(400).json({ message: "OTP không hợp lệ hoặc đã hết hạn!" });
      }

      // Mã hóa mật khẩu mới
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await accountModel.findOneAndUpdate({ email }, { password: hashedPassword });

      // Xóa OTP khỏi bộ nhớ sau khi sử dụng
      otpStore.delete(email);

      res.json({ message: "Mật khẩu đã được đổi thành công!" });

    } catch (error) {
      res.status(500).json({ message: "Lỗi trong quá trình xử lý!", error: error.message });
    }
  }
  /** Đổi mật khẩu khi có mật khẩu mới */
  static async changePassword(accountId, newPassword) {
    try {
      if (!accountId || !newPassword) throw new Error("Thiếu thông tin cần thiết!");

      // Mã hóa mật khẩu mới
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Cập nhật mật khẩu mới vào database
      const updatedAccount = await accountModel.findByIdAndUpdate(accountId, { password: hashedPassword }, { new: true });

      if (!updatedAccount) {
        return { code: 404, message: "Tài khoản không tồn tại!", status: "error" };
      }

      return { code: 200, message: "Mật khẩu đã được cập nhật thành công!", status: "success" };
    } catch (error) {
      console.error("❌ Lỗi khi đổi mật khẩu:", error);
      return { code: 500, message: error.message || "Lỗi hệ thống!", status: "error" };
    }
  }
}

module.exports = AccountService;