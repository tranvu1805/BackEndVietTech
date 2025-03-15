const { Types } = require("mongoose");
const keytokenModel = require("../models/keytoken.model");

class KeyTokenService {
    static async createKeyToken({ userId, publicKey, privateKey, refreshTokens }) {
        try {
            // 🔍 Kiểm tra nếu refreshTokens là mảng trong mảng => Cần làm phẳng mảng
            if (Array.isArray(refreshTokens) && refreshTokens.length > 0 && Array.isArray(refreshTokens[0])) {
                refreshTokens = refreshTokens.flat();
            }
    
            const existingKeyToken = await keytokenModel.findOne({ user: userId });
    
            if (existingKeyToken) {
                // Cập nhật keyToken nếu đã tồn tại
                await keytokenModel.updateOne(
                    { user: userId },
                    { 
                        $addToSet: { refreshTokens: { $each: refreshTokens } }, // Đảm bảo refreshTokens là mảng đúng
                        publicKey, 
                        privateKey 
                    }
                );
                return { message: "KeyToken updated successfully!" };
            } else {
                // Tạo mới keyToken
                const tokens = await keytokenModel.create({
                    user: userId,
                    publicKey,
                    privateKey,
                    refreshTokens: refreshTokens, // Đảm bảo truyền vào đúng dạng ["token"]
                });
                return tokens;
            }
        } catch (error) {
            console.error("❌ [ERROR] createKeyToken:", error);
            return { error: error.message };
        }
    }
    
    static async removeRefreshToken(userId, refreshToken) {
        try {
            console.log("🛠 Đang xóa refreshToken:", refreshToken, "của userId:", userId);
    
            const updated = await keytokenModel.updateOne(
                { user: userId },
                { $pull: { refreshTokens: refreshToken } } // Chỉ xóa refreshToken cụ thể
            );
    
            console.log("🔄 Kết quả cập nhật MongoDB:", updated);
            return updated.modifiedCount > 0; // Trả về true nếu có refreshToken bị xóa
        } catch (error) {
            console.error("❌ [ERROR] removeRefreshToken:", error);
            return false;
        }
    }
    
    static async findByUserId(userId) {
        try {
            const objectId = new Types.ObjectId(userId);
            const keyToken = await keytokenModel.findOne({ user: objectId });

            if (!keyToken) {
                console.error("❌ Không tìm thấy KeyStore cho userId:", userId);
                return null;
            }

            return keyToken;
        } catch (error) {
            console.error("❌ [ERROR] findByUserId:", error);
            return null;
        }
    }

    static async findByRefreshToken(refreshToken) {
        try {
            const keyToken = await keytokenModel.findOne({ refreshTokens: refreshToken });
            return keyToken;
        } catch (error) {
            console.error("❌ [ERROR] findByRefreshToken:", error);
            return null;
        }
    }

    static async updateRefreshToken(userId, newRefreshToken) {
        try {
            await keytokenModel.updateOne(
                { user: userId },
                { $addToSet: { refreshTokens: newRefreshToken } }
            );
            return true;
        } catch (error) {
            console.error("❌ [ERROR] updateRefreshToken:", error);
            return false;
        }
    }

    static async removeKeyToken(userId) {
        try {
            console.log("🛠 Đang xóa KeyToken cho userId:", userId);
    
            const result = await keytokenModel.deleteOne({ user: userId });
    
            if (result.deletedCount === 0) {
                console.error("❌ Không thể xóa KeyToken, có thể đã bị xóa hoặc không tồn tại.");
                return false;
            }
    
            console.log("✅ KeyToken đã được xóa thành công.");
            return true;
        } catch (error) {
            console.error("❌ [LOGOUT ERROR] Lỗi khi xóa keyToken:", error);
            return false;
        }
    }
    
    
}

module.exports = KeyTokenService;
