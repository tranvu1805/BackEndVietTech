const JWT = require('jsonwebtoken')
const asyncHandler = require('../helpers/asyncHandler')
const KeyTokenService  = require('../services/keytoken.service')
const { log } = require('console')
const { findUserById } = require('../services/keytoken.service')



const HEADER = {
    API_KEY: "x-api-key",
    CLIENT_ID: "x-client-id",
    AUTHORIZATION: "authorization"
};

const createToKenPair = async (payload, publicKey, privateKey) => {
    try {
        const accessToken = await JWT.sign(payload, publicKey, { expiresIn: "2 days" });
        const refreshToken = await JWT.sign(payload, privateKey, { expiresIn: "7 days" });
        return { accessToken, refreshToken };
    } catch (error) {
        console.error("❌ [ERROR] createToKenPair:", error);
        return null;
    }
};

const authentication = asyncHandler(async (req, res, next) => {
    console.log("check",req.headers[HEADER.CLIENT_ID]);
    

    const userId = req.headers[HEADER.CLIENT_ID];

    if (!userId) {
        return res.status(400).json({ success: false, message: "User ID is missing in request headers" });
    }


    const token = req.headers[HEADER.AUTHORIZATION];
    console.log("check tok",token);
    
    if (!token) {
        return res.status(403).json({ success: false, message: "Access Token is missing in request headers" });
    }

    
    const keyStore = await KeyTokenService.findByUserId(userId);
    console.log("check key",keyStore);
    console.log("check token",token);
    
    if (!keyStore) {
        return res.status(403).json({ success: false, message: "KeyStore not found for provided userId" });
    }

    try {

        const decoded = JWT.verify(token, keyStore.publicKey);
        if (decoded.userId !== userId) {
            return res.status(403).json({ success: false, message: "Invalid User ID in token payload" });
        }else{
            console.log("done !!!");
            
        }

        req.user = { _id: userId };

        req.keyStore = keyStore;
        return next();
    } catch (error) {
        console.error("Authentication Error:", error);
        return res.status(401).json({ success: false, message: "Invalid or expired access token" });
    }
});

const verifyRefreshToken = asyncHandler(async (req, res, next) => {
    const refreshToken = req.body.refreshToken;
   
    if (!refreshToken) {
        return res.status(400).json({ success: false, message: "Refresh token is missing" });
    }

    try {
        const keyStore = await KeyTokenService.findByRefreshToken(refreshToken);
        console.log("🔍 KeyStore tìm thấy:", keyStore);

        if (!keyStore || !keyStore.privateKey) {
            return res.status(403).json({ success: false, message: "KeyStore not found or invalid" });
        }

        console.log("🛠 Đang xác thực refreshToken với privateKey:", keyStore.privateKey);

        try {
            const decoded = JWT.verify(refreshToken, keyStore.privateKey);
            console.log("✅ Refresh Token verified:", decoded);
        } catch (error) {
            console.error("❌ JWT Verification Failed:", error.message);
            return res.status(401).json({ success: false, message: "Invalid or expired refresh token" });
        }

        req.keyStore = keyStore;
        next();
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal Server Error q" });
    }
});


module.exports = {
    createToKenPair,
    authentication,
    verifyRefreshToken
};
