const bcrypt = require("bcrypt");
const crypto = require("node:crypto");
const KeyTokenService = require("../services/keytoken.service");
const { getInfoData } = require("../utils");
const { createToKenPair } = require("../auth/authUtils");
const accountModel = require("../models/account.model");
const roleModel = require("../models/role.model");

class AccessService {
 // ✅ Đăng nhập tài khoản - kiểm tra bằng Public Key
static async login({ username, password }) {
  try {
    console.log(`📌 [LOGIN] Đăng nhập với username: ${username}`);

    const account = await accountModel.findOne({ username });
    if (!account) {
      console.error(`❌ [LOGIN ERROR] Username không tồn tại: ${username}`);
      return { code: 400, message: "Username hoặc mật khẩu không đúng!", status: "error" };
    }

    // Kiểm tra trạng thái tài khoản
    if (account.status === "inactive") {
      console.error(`❌ [LOGIN ERROR] Tài khoản bị khóa: ${username}`);
      return { code: 403, message: "Tài khoản của bạn đã bị khóa, vui lòng liên hệ với hỗ trợ!", status: "error" };
    }

    const isPasswordValid = await bcrypt.compare(password, account.password);
    if (!isPasswordValid) {
      console.error(`❌ [LOGIN ERROR] Sai mật khẩu cho username: ${username}`);
      return { code: 400, message: "Username hoặc mật khẩu không đúng!", status: "error" };
    }

    const privateKey = crypto.randomBytes(64).toString("hex");
    const publicKey = crypto.randomBytes(64).toString("hex");

    const tokens = await createToKenPair({ userId: account._id, username }, publicKey, privateKey);
    console.log(`✅ [TOKEN] Token pair created:`, tokens);

    await KeyTokenService.createKeyToken({
      userId: account._id,
      publicKey,
      privateKey,
      refreshTokens: [tokens.refreshToken],
    });

    return {
      code: 200,
      message: "Đăng nhập thành công!",
      status: "success",
      metadata: {
        account: getInfoData({ fields: ["_id", "username", "full_name", "email", "phone"], object: account }),
        tokens,
      },
    };
  } catch (error) {
    console.error("❌ [LOGIN ERROR] Lỗi khi đăng nhập:", error);
    return { code: 500, message: "Lỗi máy chủ nội bộ", status: "error" };
  }
}


  static async loginAdmin({ email, password }) {
    try {
      console.log(`📌 [ADMIN LOGIN] Đăng nhập admin với email: ${email}`);

      const account = await accountModel
        .findOne({ email })
        .populate("role_id", "name");

      if (!account) {
        return { code: 400, message: "Email hoặc mật khẩu không đúng!", status: "error" };
      }

      console.log("check role", account.role_id.name);


      const isPasswordValid = await bcrypt.compare(password, account.password);
      if (!isPasswordValid) {
        return { code: 400, message: "Email hoặc mật khẩu không đúng!", status: "error" };
      }

      // ✅ Kiểm tra role
      if (!account.role_id || account.role_id.name.toLowerCase() !== "admin") {
        return {
          code: 403,
          message: "Tài khoản không có quyền truy cập hệ thống quản trị!",
          status: "error",
        };
      }

      // ✅ Tạo token như bình thường
      const privateKey = crypto.randomBytes(64).toString("hex");
      const publicKey = crypto.randomBytes(64).toString("hex");

      const tokens = await createToKenPair(
        { userId: account._id, email },
        publicKey,
        privateKey
      );

      await KeyTokenService.createKeyToken({
        userId: account._id,
        publicKey,
        privateKey,
        refreshTokens: [tokens.refreshToken],
      });

      return {
        code: 200,
        message: "Đăng nhập admin thành công!",
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
      console.error("❌ [ADMIN LOGIN ERROR] Lỗi khi đăng nhập:", error);
      return { code: 500, message: "Lỗi máy chủ nội bộ", status: "error" };
    }
  }


  static async logout({ refreshToken }) {
    try {
      if (!refreshToken) {
        console.error("❌ Thiếu refreshToken trong request!");
        return { code: 400, message: "Missing refresh token!", status: "error" };
      }

      console.log("🔎 Tìm KeyStore với refreshToken:", refreshToken);
      const keyToken = await KeyTokenService.findByRefreshToken(refreshToken);

      if (!keyToken) {
        console.error("❌ Không tìm thấy KeyStore cho refreshToken này!");
        return { code: 400, message: "Invalid refresh token!", status: "error" };
      }

      console.log("🛠 Private Key trong DB:", keyToken.privateKey);

      // ✅ Giải mã refreshToken để lấy userId
      let decoded;
      try {
        decoded = JWT.verify(refreshToken, keyToken.privateKey);
        console.log("✅ Refresh Token verified:", decoded);
      } catch (error) {
        console.error("❌ JWT Verification Failed:", error.message);
        return { code: 401, message: "Invalid or expired refresh token", status: "error" };
      }

      const userId = decoded.userId;
      console.log("🛠 UserID từ token:", userId);

      // 🛠 Xóa refreshToken của thiết bị hiện tại
      console.log("🛠 Đang xóa refreshToken...");
      const updated = await KeyTokenService.removeRefreshToken(userId, refreshToken);

      if (!updated) {
        console.error("❌ Không thể xóa refreshToken, có thể đã bị xóa hoặc không tồn tại.");
        return { code: 400, message: "Logout failed!", status: "error" };
      }

      console.log("✅ Logout sucess ! RefreshToken đã được xóa thành công!");
      return { code: 200, message: "Logout successful!", status: "success" };
    } catch (error) {
      console.error("❌ [LOGOUT ERROR] Lỗi khi đăng xuất:", error);
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
        return {
          code: 400,
          message: "Request body is missing!",
          status: "error",
        };
      }

      const {
        username,
        full_name,
        email,
        password,
        phone,
        address="null",
        status = "active",
      } = body;
      console.log("📌 Dữ liệu đầu vào:", body);

      if (
        !username ||
        !email ||
        !password ||
        !full_name ||
        !phone ||
        !address ||
        !status
      ) {
        return {
          code: 400,
          message: "All fields are required!",
          status: "error",
        };
      }

      const existingAccount = await accountModel
        .findOne({ $or: [{ username }, { email }] })
        .lean();
      if (existingAccount) {
        return {
          code: 400,
          message: "Username or Email already exists!",
          status: "error",
        };
      }

      const existingPhone = await accountModel.findOne({ phone }).lean();
      if (existingPhone) {
        return {
          code: 400,
          message: "Phone number already exists!",
          status: "error",
        };
      }

      const roleData = await roleModel.findOne({ name: roleName }).lean();
      if (!roleData) {
        return { code: 400, message: "Invalid role!", status: "error" };
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      // Ảnh mặc định
      const DEFAULT_PROFILE_IMAGE_ID = "67d3b37b63838e785e7844da";
      const newAccount = await accountModel.create({
        username,
        full_name,
        phone,
        address,
        email,
        password: hashedPassword,
        profile_image: DEFAULT_PROFILE_IMAGE_ID,
        role_id: roleData._id,
        status,
      });

      const privateKey = crypto.randomBytes(64).toString("hex");
      const publicKey = crypto.randomBytes(64).toString("hex");
      const tokens = await createToKenPair(
        { userId: newAccount._id, email },
        publicKey,
        privateKey
      );

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
            fields: [
              "_id",
              "username",
              "full_name",
              "email",
              "phone",
              "status",
            ],
            object: newAccount,
          }),
          tokens,
        },
      };
    } catch (error) {
      console.error(`❌ Lỗi khi đăng ký ${roleName}:`, error);
      return {
        code: 500,
        message: "Internal Server Error",
        status: "error",
        error: error.message,
      };
    }
  }

}

module.exports = AccessService;
