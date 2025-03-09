<<<<<<< HEAD
const AccountService = require("../services/account.service");
const mongoose = require("mongoose");

class AccountController {

    // ✅ Lấy thông tin tài khoản theo ID
    async getAccount(req, res, next) {
        try {
            const { id } = req.params;
            console.log("📌 ID nhận từ request:", id);

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ message: "Invalid account ID!" });
            }

            const account = await AccountService.getAccountById(id);
            return res.status(account.code).json(account);
        } catch (error) {
            return next(error);
        }
=======
const AccessService = require("../services/account.service");
// const {OK, CREATED} = require("../core/success.response");
class AccountController {
  // Đăng ký tài khoản
  async signUp(req, res, next) {
    //Todo: bỏ try catch, vì đã bọc trong asyncHandle
    try {
      console.log(`[P]:: signUp::`, req.body);

      // Gọi Service để xử lý đăng ký
      const result = await AccessService.signUp(req.body);
      //   new CREATED({
      //     message: "Tài khoản đã tạo thành công",
      //     metadata: await AccessService.signUp(req.body),
      //     options: {
      //         limit: 10000
      //     }
      //   }).send(res);
      //bỏ return
      return res.status(result.code).json(result);
    } catch (error) {
      next(error); // Đẩy lỗi vào middleware xử lý lỗi của Express
>>>>>>> main
    }
  }

<<<<<<< HEAD
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
=======
  // Đăng nhập tài khoản
  async login(req, res, next) {
    try {
      console.log(`[P]:: login::`, req.body);

      const result = await AccessService.login(req.body);

      return res.status(result.code).json(result);
    } catch (error) {
      next(error);
    }
  }
>>>>>>> main
}

module.exports = new AccountController();
