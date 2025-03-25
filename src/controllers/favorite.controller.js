const favoriteService = require("../services/favorite.service");


class FavouriteController {
    static async addToFavorites(req, res) {
        try {
            const userId = req.user._id;
            const { productId } = req.body;
            const favorite = await favoriteService.addToFavorites(userId, productId);
            res.status(201).json({ success: true, favorite });
        } catch (error) {
            if (error.code === 11000) {
                return res.status(400).json({ success: false, message: "Sản phẩm đã được thêm vào yêu thích." });
            }
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async removeFromFavorites(req, res) {
        try {
            const userId = req.user._id;
            const productId = req.params.productId;
            await favoriteService.removeFromFavorites(userId, productId);
            res.json({ success: true, message: "Đã xoá khỏi danh sách yêu thích." });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async getFavorites(req, res) {
        try {
            const userId = req.user._id;
            const favorites = await favoriteService.getFavorites(userId);
            res.json({ success: true, favorites });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
module.exports = FavouriteController;
