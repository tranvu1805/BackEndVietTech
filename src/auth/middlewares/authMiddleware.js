const jwt = require("jsonwebtoken");
const KeyTokenService = require("../../services/keytoken.service");


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

        
        req.user = decoded;
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



module.exports = {
    authentication,
    authSession
};
