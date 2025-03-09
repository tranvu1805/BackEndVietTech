const { Types } = require("mongoose");
const keytokenModel = require("../models/keytoken.model");

class KeyTokenService {
    static createKeyToken = async ({ userId, publicKey, privateKey, refreshTokens }) => {
        try {
            const existingKeyToken = await keytokenModel.findOne({ user: userId });

            if (existingKeyToken) {
                // Nếu đã có, thêm refreshToken vào mảng (tránh trùng lặp)
                await keytokenModel.updateOne(
                    { user: userId },
                    { 
                        $addToSet: { refreshTokens }, 
                        publicKey, 
                        privateKey 
                    }
                );
                return { message: "KeyToken updated successfully!" };
            } else {
                // Nếu chưa có, tạo mới với refreshTokens là mảng
                const tokens = await keytokenModel.create({
                    user: userId,
                    publicKey,
                    privateKey,
                    refreshTokens: [refreshTokens], // Đảm bảo lưu dưới dạng mảng
                });
                return tokens;
            }
        } catch (error) {
            console.error("❌ [ERROR] createKeyToken:", error);
            return { error: error.message };
        }
    };

    static findUserById = async (userId) => {
        try {
            const keyToken = await keytokenModel.findOne({ user: Types.ObjectId(userId) });
            return keyToken;
        } catch (error) {
            console.error("❌ [ERROR] findByUserId:", error);
            return { error: error.message };
        }
    }

    static async removeKeyToken(userId) {
        try {
            const result = await keytokenModel.deleteOne({ user: userId });
            return result.deletedCount > 0;
        } catch (error) {
            console.error("❌ [LOGOUT ERROR] Lỗi khi xóa keyToken:", error);
            return false;
        }
    }
}

module.exports = KeyTokenService;
