const AccessService = require("../services/account.service");

class AccountController {
    // Đăng ký tài khoản
    async signUp(req, res, next) {
        try {
            console.log(`[P]:: signUp::`, req.body);

            // Gọi Service để xử lý đăng ký
            const result = await AccessService.signUp(req.body);

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
