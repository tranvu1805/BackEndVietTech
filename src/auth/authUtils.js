const JWT = require('jsonwebtoken')
const asyncHandler = require('../helpers/asyncHandler')
const { findUserById } = require('../services/keytoken.service')
const { log } = require('console')

const HEADER = {
    API_KEY: 'x-api-key',
    CLIENT_ID: 'x-client-id',
    AUTHORIZATION: 'authorization'
}

const createToKenPair = async (payload, publicKey, privateKey) => {
    try {

        const accessToken = await JWT.sign(payload, publicKey, {

            expiresIn: '2 days'
        })
        const represhToken = await JWT.sign(payload, privateKey, {

            expiresIn: '7 days'
        })

        JWT.verify(accessToken, publicKey, (err, decode) => {
            if (err) {
                console.error('err verify::', err)
            } else {
                console.log('decode verify::', decode);

            }
        })
        return { accessToken, represhToken }
    } catch (error) {

    }
}


const authentication = asyncHandler(async (req, res, next) => {
    const userId = req.headers[HEADER.CLIENT_ID];  // Lấy userId từ headers

    // Kiểm tra nếu userId không có trong header
    log('userId nek', req.headers[HEADER.CLIENT_ID])
    if (!userId) {
        return res.status(400).json({ success: false, message: 'User ID is missing in request headers' });
    }

    // Lấy access token từ header 'authorization'
    const token = req.headers[HEADER.AUTHORIZATION];
    console.log('token', token);
    
    if (!token) {
        return res.status(403).json({ success: false, message: 'Access Token is missing in request headers' });
    }

    // Kiểm tra người dùng trong cơ sở dữ liệu (keyStore)
    const keyStore = await findUserById(userId);
    if (!keyStore) {
        return res.status(403).json({ success: false, message: 'KeyStore not found for provided userId' });
    }

    try {
        // Xác minh access token
        const decoded = JWT.verify(token, keyStore.publicKey); // Xác minh token bằng public key

        // Kiểm tra userId trong payload của token có khớp với userId từ header không
        if (decoded.userId !== userId) {
            return res.status(403).json({ success: false, message: 'Invalid User ID in token payload' });
        }

        // Lưu thông tin keyStore vào req để sử dụng tiếp theo
        req.keyStore = keyStore; 

        console.log('Authentication Successful!');
        return next(); // Tiếp tục đến route tiếp theo nếu xác thực thành công
    } catch (error) {
        console.error('Authentication Error:', error); // In lỗi ra console để kiểm tra
        return res.status(401).json({ success: false, message: 'Invalid or expired access token' });
    }
});

module.exports = {
    createToKenPair,
    authentication
}