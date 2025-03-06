const accountModel = require("../models/account.model"); // Đổi từ shopModel -> accountModel
const roleModel = require("../models/role.model"); // Model cho roles
const bcrypt = require("bcrypt");
const crypto = require("node:crypto");
const { findByEmail } = require("../services/shop.service");
// const keytokenModel = require("../models/keytoken.model");
// const KeyTokenService = require("../services/keytoken.service");
const { getInfoData } = require("../utils");
const { ForbiddenRequestError } = require("../core/error.response");
// const { createToKenPair } = require("../auth/authUntils");

class AccessService {
  static login = async ({ email, password, refreshToken = null }) => {
    const foundAccount = await findByEmail({ email });
    if (!foundAccount) {
      throw new ForbiddenRequestError("Account not registed!");
    }
    const matchPassword = await bcrypt.compare(password, foundAccount.password);
    if (!matchPassword) {
      throw new ForbiddenRequestError("Password is incorrect!");
    }
  };
  static signUp = async ({
    name,
    email,
    password,
    phone,
    address,
    role = "Customer",
  }) => {
    //Todo: bỏ try catch, thay bằng error handler
    try {
      console.log("Received:", { name, email, password, phone, address, role });

      // Step 1: Kiểm tra dữ liệu đầu vào
      if (!email || !password || !name || !phone || !address) {
        return {
          code: 400,
          message: "All fields are required!",
          status: "error",
        };
      }

      // Step 2: Kiểm tra email đã tồn tại chưa
      const existingAccount = await accountModel.findOne({ email }).lean();
      if (existingAccount) {
        return {
          code: 400,
          message: "Account already registered!",
          status: "error",
        };
      }

      // Step 3: Lấy role_id từ collection `roles`
      const roleData = await roleModel.findOne({ name: role }).lean();
      if (!roleData) {
        return {
          code: 400,
          message: "Invalid role!",
          status: "error",
        };
      }

      // Step 4: Hash mật khẩu
      const passwordHash = await bcrypt.hash(password, 10);
      console.log("Hashed Password:", passwordHash);

      // Step 5: Tạo tài khoản mới
      const newAccount = await accountModel.create({
        username: email.split("@")[0], // Tạo username từ email
        full_name: name,
        phone,
        address,
        email,
        password: passwordHash,
        role_id: roleData._id,
      });

      if (newAccount) {
        // Step 6: Tạo privateKey & publicKey
        const privateKey = crypto.randomBytes(64).toString("hex");
        const publicKey = crypto.randomBytes(64).toString("hex");
        console.log({ privateKey, publicKey });

        // Step 7: Lưu privateKey & publicKey vào MongoDB
        const keyStore = await KeyTokenService.createKeyToken({
          userId: newAccount._id,
          publicKey,
          privateKey,
        });

        // Step 8: Tạo token pair
        const tokens = await createToKenPair(
          { userId: newAccount._id, email },
          publicKey,
          privateKey
        );
        console.log(`Create token success::`, tokens);

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
      }
    } catch (error) {
      console.error(error);
      return {
        code: 500,
        message: error.message,
        status: "error",
      };
    }
  };
}

module.exports = AccessService;
