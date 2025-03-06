const accountModel = require("../models/account.model");
const roleModel = require("../models/role.model");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const keyTokenModel = require("../models/keytoken.model");
const { getInfoData } = require("../utils");
const { createToKenPair } = require("../auth/authUntils");

class AccountService {

    // ✅ Đăng ký tài khoản
    static async signUp({ body }) {
        try {
            if (!body || Object.keys(body).length === 0) {
                return { code: 400, message: "Request body is missing!", status: "error" };
            }

            const { username, full_name, email, password, phone, address, role = "Customer" } = body;
            console.log("📌 Dữ liệu đầu vào:", body);

            if (!username || !email || !password || !full_name || !phone || !address) {
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

            const roleData = await roleModel.findOne({ name: role }).lean();
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
            });

            const privateKey = crypto.randomBytes(64).toString("hex");
            const publicKey = crypto.randomBytes(64).toString("hex");

            const tokens = await createToKenPair({ userId: newAccount._id, email }, publicKey, privateKey);

            // 🔹 Lưu khóa và refreshToken vào DB
            await keyTokenModel.create({
                user: newAccount._id,
                publicKey,
                privateKey,
                refreshTokens: [tokens.refreshToken], // Thêm refreshToken vào đây
            });

            return {
                code: 201,
                message: "Account registered successfully!",
                status: "success",
                metadata: {
                    account: getInfoData({
                        fields: ["_id", "username", "full_name", "email", "phone"],
                        object: newAccount,
                    }),
                    tokens,
                },
            };
        } catch (error) {
            console.error("❌ Lỗi khi đăng ký tài khoản:", error);
            return { code: 500, message: "Internal Server Error", status: "error", error: error.message };
        }
    }
    // ✅ Đăng ký tài khoản nhân viên (chỉ dành cho Admin)
    static async signUpEmployee({ body }) {
        try {
            if (!body || Object.keys(body).length === 0) {
                return { code: 400, message: "Request body is missing!", status: "error" };
            }
    
            const { username, full_name, email, password, phone, address, role = "Staff" } = body;
            console.log("📌 Dữ liệu đầu vào:", body);
    
            // Kiểm tra thiếu trường dữ liệu
            if (!username || !email || !password || !full_name || !phone || !address) {
                return { code: 400, message: "All fields are required!", status: "error" };
            }
    
            // Kiểm tra trùng username hoặc email
            const existingAccount = await accountModel.findOne({ $or: [{ username }, { email }] }).lean();
            if (existingAccount) {
                console.error("❌ Lỗi: Username hoặc Email đã tồn tại.");
                return { code: 400, message: "Username or Email already exists!", status: "error" };
            }
    
            // Kiểm tra trùng số điện thoại
            const existingPhone = await accountModel.findOne({ phone }).lean();
            if (existingPhone) {
                console.error("❌ Lỗi: Số điện thoại đã tồn tại.");
                return { code: 400, message: "Phone number already exists!", status: "error" };
            }
    
            // Kiểm tra role có hợp lệ không
            const roleData = await roleModel.findOne({ name: role }).lean();
            if (!roleData) {
                console.error("❌ Lỗi: Role không hợp lệ.");
                return { code: 400, message: "Invalid role!", status: "error" };
            }
    
            // Hash mật khẩu
            const hashedPassword = await bcrypt.hash(password, 10);
    
            // Tạo tài khoản nhân viên mới
            const newAccount = await accountModel.create({
                username,
                full_name,
                phone,
                address,
                email,
                password: hashedPassword,
                role_id: roleData._id,
                
            });
    
            console.log(`✅ Nhân viên ${username} đã được tạo thành công.`);
    
            // Tạo khóa bảo mật
            const privateKey = crypto.randomBytes(64).toString("hex");
            const publicKey = crypto.randomBytes(64).toString("hex");
    
            // Tạo token đăng nhập
            const tokens = await createToKenPair({ userId: newAccount._id, email }, publicKey, privateKey);
    
            // Lưu khóa và refreshToken vào DB
            await keyTokenModel.create({
                user: newAccount._id,
                publicKey,
                privateKey,
                refreshTokens: [tokens.refreshToken], // Thêm refreshToken vào đây
            });
    
            console.log(`🔑 Token được tạo thành công cho nhân viên ${username}`);
    
            return {
                code: 201,
                message: "Employee account registered successfully!",
                status: "success",
                metadata: {
                    account: getInfoData({
                        fields: ["_id", "username", "full_name", "email", "phone"],
                        object: newAccount,
                    }),
                    tokens,
                },
            };
        } catch (error) {
            console.error("❌ Lỗi khi đăng ký nhân viên:", error);
            return { code: 500, message: "Internal Server Error", status: "error", error: error.message };
        }
    }
    
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

            // 📝 5️⃣ Cập nhật keyToken vào DB
            const updatedKeyToken = await keyTokenModel.findOneAndUpdate(
                { user: account._id },
                {
                    $set: { publicKey, privateKey },
                    $addToSet: { refreshTokens: tokens.refreshToken } // ✅ Đảm bảo refreshToken được lưu
                },
                { upsert: true, new: true }
            );

            console.log(`✅ [DB] KeyToken updated:`, updatedKeyToken);

            // 🚀 6️⃣ Trả về kết quả
            console.log(`🎉 [SUCCESS] Đăng nhập thành công: ${email}`);
            return {
                code: 200,
                message: "Đăng nhập thành công!",
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
            console.error("❌ [LOGIN ERROR] Lỗi khi đăng nhập sai tài khoản hoặc mật khẩu:", error);
            return { code: 500, message: "Lỗi máy chủ nội bộ", status: "error" };
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
