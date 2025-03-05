const accountModel = require("../models/account.model");
const roleModel = require("../models/role.model");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const keyTokenModel = require("../models/keytoken.model");
const { getInfoData } = require("../utils");
const { createToKenPair } = require("../auth/authUntils");

class AccountService {
    
    // ✅ Đăng ký tài khoản
    static async signUp({ username, name, email, password, phone, address, role = "Customer" }) {
        try {
            console.log("📌 Dữ liệu đầu vào:", { username, name, email, password, phone, address, role });

            // Kiểm tra dữ liệu hợp lệ
            if (!username || !email || !password || !name || !phone || !address) {
                return { code: 400, message: "All fields are required!", status: "error" };
            }

            // Kiểm tra username hoặc email đã tồn tại chưa
            const existingAccount = await accountModel.findOne({ $or: [{ username }, { email }] }).lean();
            if (existingAccount) {
                return { code: 400, message: "Username or Email already exists!", status: "error" };
            }

            // Tìm role_id tương ứng
            const roleData = await roleModel.findOne({ name: role }).lean();
            if (!roleData) {
                return { code: 400, message: "Invalid role!", status: "error" };
            }

            // Mã hóa mật khẩu
            const hashedPassword = await bcrypt.hash(password, 10);

            // Tạo tài khoản mới
            const newAccount = await accountModel.create({
                username,
                full_name: name,
                phone,
                address,
                email,
                password: hashedPassword,
                role_id: roleData._id,
            });

            // Tạo privateKey & publicKey
            const privateKey = crypto.randomBytes(64).toString("hex");
            const publicKey = crypto.randomBytes(64).toString("hex");

            // Lưu key vào MongoDB
            await keyTokenModel.create({
                user: newAccount._id,
                publicKey,
                privateKey,
                refreshTokens: [],
            });

            // Tạo token pair
            const tokens = await createToKenPair({ userId: newAccount._id, email }, publicKey, privateKey);

            return {
                code: 201,
                message: "Account registered successfully!",
                status: "success",
                metadata: {
                    account: getInfoData({
                        fields: ["_id", "username", "full_name", "email"],
                        object: newAccount,
                    }),
                    tokens,
                },
            };
        } catch (error) {
            console.error("❌ Lỗi khi đăng ký tài khoản:", error);
            return { code: 500, message: "Internal Server Error", status: "error" };
        }
    }

    // ✅ Đăng nhập tài khoản
    static async login({ email, password }) {
        try {
            console.log("📌 Đăng nhập với email:", email);

            // Tìm tài khoản theo email
            const account = await accountModel.findOne({ email });
            if (!account) {
                return { code: 400, message: "Invalid email or password!", status: "error" };
            }

            // Kiểm tra mật khẩu
            const isPasswordValid = await bcrypt.compare(password, account.password);
            if (!isPasswordValid) {
                return { code: 400, message: "Invalid email or password!", status: "error" };
            }

            // Tạo privateKey & publicKey mới
            const privateKey = crypto.randomBytes(64).toString("hex");
            const publicKey = crypto.randomBytes(64).toString("hex");

            // Lưu key mới vào MongoDB
            await keyTokenModel.updateOne(
                { user: account._id },
                { $set: { publicKey, privateKey } },
                { upsert: true }
            );

            // Tạo token pair
            const tokens = await createToKenPair({ userId: account._id, email }, publicKey, privateKey);

            return {
                code: 200,
                message: "Login successful!",
                status: "success",
                metadata: {
                    account: getInfoData({
                        fields: ["_id", "username", "full_name", "email"],
                        object: account,
                    }),
                    tokens,
                },
            };
        } catch (error) {
            console.error("❌ Lỗi khi đăng nhập:", error);
            return { code: 500, message: "Internal Server Error", status: "error" };
        }
    }

    // ✅ Lấy thông tin tài khoản theo ID
    static async getAccountById(accountId) {
        try {
            console.log("📌 Lấy thông tin tài khoản ID:", accountId);

            // Tìm tài khoản theo ID
            const account = await accountModel.findById(accountId).select("-password");
            if (!account) {
                return { code: 404, message: "Account not found!", status: "error" };
            }

            return { code: 200, message: "Account found!", status: "success", data: account };
        } catch (error) {
            console.error("❌ Lỗi khi lấy tài khoản:", error);
            return { code: 500, message: "Internal Server Error", status: "error" };
        }
    }

    // ✅ Cập nhật thông tin tài khoản
    static async updateAccount(accountId, updateData) {
        try {
            console.log("📌 Cập nhật tài khoản ID:", accountId, "Dữ liệu mới:", updateData);

            // Nếu có cập nhật mật khẩu, mã hóa lại trước khi lưu
            if (updateData.password) {
                updateData.password = await bcrypt.hash(updateData.password, 10);
            }

            // Cập nhật tài khoản
            const updatedAccount = await accountModel.findByIdAndUpdate(accountId, updateData, { new: true }).select("-password");
            if (!updatedAccount) {
                return { code: 404, message: "Account not found!", status: "error" };
            }

            return { code: 200, message: "Account updated successfully!", status: "success", data: updatedAccount };
        } catch (error) {
            console.error("❌ Lỗi khi cập nhật tài khoản:", error);
            return { code: 500, message: "Internal Server Error", status: "error" };
        }
    }
}

module.exports = AccountService;
