const express = require('express');
const router = express.Router();
const { uploadImage, addImageToProduct } = require('../../controllers/image.controller');
const upload = require('../../auth/middlewares/upload.middleware');

// API upload ảnh
router.post('/upload', upload.single('image'), uploadImage);

// API thêm ảnh vào sản phẩm
router.post('/add-image-to-product', addImageToProduct);

module.exports = router;
