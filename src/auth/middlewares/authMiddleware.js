const jwt = require("jsonwebtoken");
const KeyTokenService = require("../../services/keytoken.service");
const accountModel = require("../../models/account.model");


const authentication = async (req, res, next) => {
    console.log("🔐 Authenticating...");
    console.log("🔍 Cookies:", req.cookies);
    console.log("secret_key", process.env.secret_key);

    try {
        const cookies = req.cookies;

        const { token, userId } = cookies

        if (!token) {
            console.error("❌ Missing Token in Cookie");
            return res.redirect("/");
        }


        const keyStore = await KeyTokenService.findByUserId(userId);
        if (!keyStore) {
            console.error(`❌ KeyStore không tìm thấy cho userId: ${userId}`);
            return res.redirect("/");
        }
        // console.log("🔍 KeyStore tìm thấy:", keyStore);


        const decoded = jwt.verify(token, keyStore.publicKey);
        console.log("✅ Token Verified:", decoded);


        if (decoded.userId !== userId) {
            console.error("❌ Invalid User ID in token payload");
            return res.redirect("/");
        }

      



        const account = await accountModel.findById(decoded.userId).populate("role_id");
        if (!account) return res.redirect("/");

        req.user = {
            ...decoded,
            username: account.username,
            full_name: account.full_name,
            email: account.email,
            role: account.role_id?.name || "Unknown"
        };

        console.log("✅ Final user object in req.user:", req.user);

        next();
    } catch (error) {
        console.error("❌ Authentication Error:", error.message);
        res.clearCookie("token");
        return res.redirect("/");
    }
};
const authSession = (req, res, next) => {
    console.log("✅ check session", req.session);
    if (!req.session.user) {
        console.error("❌ Người dùng chưa đăng nhập!");
        return res.redirect("/");
    }


    next();
};

const isAdmin = (req, res, next) => {
    const user = req.user;
    console.log("user 2", user);

    if (!user || user.role !== "Admin") {
        return res.status(403).json({
            message: "Bạn không có quyền thực hiện hành động này!",
            status: "error"
        });
    }
    next();
};



module.exports = {
    authentication,
    authSession,
    isAdmin
};
