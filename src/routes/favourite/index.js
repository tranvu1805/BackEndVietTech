const express = require("express");
const router = express.Router();
const { authentication } = require("../../auth/authUtils");
const favoriteController = require("../../controllers/favorite.controller");

// Áp dụng xác thực cho tất cả route bên dưới
router.use(authentication);

// Thêm sản phẩm vào danh sách yêu thích
router.post("/", favoriteController.addToFavorites);

// Xoá sản phẩm khỏi danh sách yêu thích
router.delete("/:productId", favoriteController.removeFromFavorites);

// Lấy danh sách sản phẩm yêu thích của người dùng
router.get("/", favoriteController.getFavorites);

module.exports = router;
