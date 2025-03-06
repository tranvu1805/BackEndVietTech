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
    }
  }

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
}

module.exports = new AccountController();
