const bcrypt = require("bcrypt");
const crypto = require("node:crypto");
const KeyTokenService = require("../services/keytoken.service");
const { getInfoData } = require("../utils");
const { createToKenPair } = require("../auth/authUntils");
const accountModel = require("../models/account.model");
const roleModel = require("../models/role.model");

class AccessService {
    // ✅ Đăng nhập tài khoản
    static async login({ email, password }) {
        try {
            console.log(`📌 [LOGIN] Đăng nhập với email: ${email}`);

            // 🔎 1️⃣ Tìm tài khoản theo email
            const account = await accountModel.findOne({ email });
            if (!account) {
                console.error(`❌ [LOGIN ERROR] Email không tồn tại: ${email}`);
                return { code: 400, message: "Email hoặc mật khẩu không đúng!", status: "error" };
            }

            // 🔎 2️⃣ Kiểm tra mật khẩu
            const isPasswordValid = await bcrypt.compare(password, account.password);
            if (!isPasswordValid) {
                console.error(`❌ [LOGIN ERROR] Sai mật khẩu cho email: ${email}`);
                return { code: 400, message: "Email hoặc mật khẩu không đúng!", status: "error" };
            }

            // 🔑 3️⃣ Tạo privateKey & publicKey mới
            const privateKey = crypto.randomBytes(64).toString("hex");
            const publicKey = crypto.randomBytes(64).toString("hex");

            // 🔐 4️⃣ Tạo token pair (accessToken & refreshToken)
            const tokens = await createToKenPair({ userId: account._id, email }, publicKey, privateKey);
            console.log(`✅ [TOKEN] Token pair created:`, tokens);

            // 📝 5️⃣ Cập nhật keyToken vào DB (Đảm bảo lưu đúng refreshTokens)
            await KeyTokenService.createKeyToken({
                userId: account._id,
                publicKey,
                privateKey,
                refreshTokens: tokens.refreshToken // Đưa refreshToken vào đúng mảng
            });

            // 🚀 6️⃣ Trả về kết quả
            console.log(`🎉 [SUCCESS] Đăng nhập thành công: ${email}`);
            return {
                code: 200,
                message: "Đăng nhập thành công!",
                status: "success",
                metadata: {
                    account: getInfoData({
                        fields: ["_id", "username", "full_name", "email", "phone"],
                        object: account,
                    }),
                    tokens,
                },
            };
        } catch (error) {
            console.error("❌ [LOGIN ERROR] Lỗi khi đăng nhập:", error);
            return { code: 500, message: "Lỗi máy chủ nội bộ", status: "error" };
        }
    }

    // ✅ Đăng ký tài khoản khách hàng
    static async signUp({ body, role = "Customer" }) {
        return await this.registerAccount(body, role);
    }
    // ✅ Đăng ký tài khoản nhân viên
    static async signUpEmployee({ body }) {
        return await this.registerAccount(body, "Staff");
    }
    // ✅ Đăng ký tài khoản
    static async registerAccount(body, roleName) {
        try {
            if (!body || Object.keys(body).length === 0) {
                return { code: 400, message: "Request body is missing!", status: "error" };
            }

            const { username, full_name, email, password, phone, address, status = "inactive" } = body;
            console.log("📌 Dữ liệu đầu vào:", body);

            if (!username || !email || !password || !full_name || !phone || !address || !status) {
                return { code: 400, message: "All fields are required!", status: "error" };
            }

            const existingAccount = await accountModel.findOne({ $or: [{ username }, { email }] }).lean();
            if (existingAccount) {
                return { code: 400, message: "Username or Email already exists!", status: "error" };
            }

            const existingPhone = await accountModel.findOne({ phone }).lean();
            if (existingPhone) {
                return { code: 400, message: "Phone number already exists!", status: "error" };
            }

            const roleData = await roleModel.findOne({ name: roleName }).lean();
            if (!roleData) {
                return { code: 400, message: "Invalid role!", status: "error" };
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const newAccount = await accountModel.create({
                username,
                full_name,
                phone,
                address,
                email,
                password: hashedPassword,
                role_id: roleData._id,
                status,
            });

            const privateKey = crypto.randomBytes(64).toString("hex");
            const publicKey = crypto.randomBytes(64).toString("hex");
            const tokens = await createToKenPair({ userId: newAccount._id, email }, publicKey, privateKey);

            await KeyTokenService.createKeyToken({
                userId: newAccount._id,
                publicKey,
                privateKey,
            });

            return {
                code: 201,
                message: `${roleName} account registered successfully!`,
                status: "success",
                metadata: {
                    account: getInfoData({
                        fields: ["_id", "username", "full_name", "email", "phone", "status"],
                        object: newAccount,
                    }),
                    tokens,
                },
            };
        } catch (error) {
            console.error(`❌ Lỗi khi đăng ký ${roleName}:`, error);
            return { code: 500, message: "Internal Server Error", status: "error", error: error.message };
        }
    }
    static async logout(userId) {
        try {
            const keyToken = await KeyTokenService.findByRefreshToken(refreshToken);
            if (!keyToken) {
                return { code: 400, message: "Invalid refresh token!", status: "error" };
            }
            const isDeleted = await KeyTokenService.removeKeyToken(userId);


            if (!isDeleted) {
                return { code: 400, message: "Đăng xuất thất bại!", status: "error" };
            } else {
                console.log(" Logout success !!");
            }

            return { code: 200, message: "Đăng xuất thành công!", status: "success" };
        } catch (error) {
            console.error("❌ [LOGOUT ERROR] Lỗi khi đăng xuất:", error);
            return { code: 500, message: "Lỗi máy chủ nội bộ", status: "error" };
        }
    }
}

module.exports = AccessService;
