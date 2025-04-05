const crypto = require("crypto");
const bcrypt = require("bcrypt");
const accountModel = require("../models/account.model");
const moment = require("moment");
const Image = require("../models/image.model");
const nodemailer = require("nodemailer");
const roleModel = require("../models/role.model");

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
  static async getAllAccounts(page = 1, limit = 10, search = "", role = "", status = "") {
    try {
      const skip = (page - 1) * limit;
      const query = {};

      // 🔍 Tìm kiếm theo tên, username, email
      if (search) {
        query.$or = [
          { full_name: { $regex: search, $options: "i" } },
          { username: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ];
      }

      // 🧑‍💼 Lọc theo vai trò (role name)
      if (role) {
        const matchedRoles = await roleModel.find({ name: role });
        if (matchedRoles.length > 0) {
          query.role_id = matchedRoles[0]._id;
        } else {
          // Nếu role không khớp, trả về danh sách rỗng
          return {
            code: 200,
            message: "No matching role found.",
            status: "success",
            data: { accounts: [], totalAccounts: 0, page, totalPages: 0 },
          };
        }
      }

      // 🔄 Lọc theo trạng thái
      if (status) {
        query.status = status;
      }

      const [accounts, totalAccounts] = await Promise.all([
        accountModel
          .find(query)
          .populate("role_id", "name")
          .populate("profile_image")
          .select("-password")
          .skip(skip)
          .limit(limit),
        accountModel.countDocuments(query),
      ]);

      return {
        code: 200,
        message: "Accounts fetched successfully!",
        status: "success",
        data: {
          accounts,
          totalAccounts,
          page,
          totalPages: Math.ceil(totalAccounts / limit),
          search,
          role,
          status,
          limit
        },
      };
    } catch (error) {
      console.error("❌ Error fetching accounts:", error);
      return { code: 500, message: error.message || "Internal Server Error", status: "error" };
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

      // Nếu không có OTP & mật khẩu => Gửi OTP mới
      if (!otp && !newPassword) {
        const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

        // Xóa OTP cũ nếu có và tạo OTP mới
        otpStore.delete(email);

        // Lưu OTP mới vào bộ nhớ, có hạn sử dụng trong 5 phút
        otpStore.set(email, { otp: generatedOtp, expires: Date.now() + 5 * 60 * 1000 });

        // Gửi OTP qua email với HTML format
        await transporter.sendMail({
          from: `"VietTech Support" <${process.env.SMTP_USER}>`, // Địa chỉ gửi email
          to: email,
          subject: "🔐 Xác minh OTP - Đặt lại mật khẩu VietTech",
          replyTo: "noreply@vt.com", // Địa chỉ email không thể trả lời
          headers: {
            'X-Precedence': 'bulk',  // Giảm khả năng email bị vào thư rác
            'X-Mailer': 'VietTechMailer', // Đặt tên phần mềm gửi email
          },
          text: `
          Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản VietTech. Đây là mã OTP của bạn:
          
          ${generatedOtp}
          
          Mã OTP có hiệu lực trong 5 phút. Không chia sẻ mã này với bất kỳ ai.
          
          Trân trọng,
          Đội ngũ VietTech
        `,
          html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <h2 style="color: #007BFF;">🔐 Mã xác minh OTP của bạn</h2>
            <p>Xin chào,</p>
            <p>Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản VietTech. Đây là mã OTP của bạn:</p>
            <h3 style="font-size: 24px; color: #D32F2F; text-align: center; background: #F8F9FA; padding: 10px; border-radius: 8px;">
              ${generatedOtp}
            </h3>
            <p>Mã OTP có hiệu lực trong <b>5 phút</b>. Không chia sẻ mã này với bất kỳ ai.</p>
            <p>Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
            <p>Trân trọng,<br>Đội ngũ VietTech</p>
          </div>
        `,
        });

        return res.json({ message: "OTP đã được gửi thành công! Vui lòng kiểm tra email của bạn." });
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

/** Đổi mật khẩu có kiểm tra mật khẩu cũ */
static async changePassword(accountId, oldPassword, newPassword) {
  try {
    if (!accountId || !oldPassword || !newPassword) {
      throw new Error("Thiếu thông tin cần thiết!");
    }

    // Tìm tài khoản theo ID
    const account = await accountModel.findById(accountId);
    if (!account) {
      return { code: 404, message: "Tài khoản không tồn tại!", status: "error" };
    }

    // So sánh mật khẩu cũ
    const isMatch = await bcrypt.compare(oldPassword, account.password);
    if (!isMatch) {
      return { code: 400, message: "Mật khẩu cũ không đúng!", status: "error" };
    }

    // Mã hóa mật khẩu mới
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Cập nhật mật khẩu mới
    account.password = hashedPassword;
    await account.save();

    return { code: 200, message: "Mật khẩu đã được cập nhật thành công!", status: "success" };
  } catch (error) {
    console.error("❌ Lỗi khi đổi mật khẩu:", error);
    return { code: 500, message: error.message || "Lỗi hệ thống!", status: "error" };
  }
}

}

module.exports = AccountService;