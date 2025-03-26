const express = require('express');
const router = express.Router();
const { uploadImage, addImageToProduct,updateImageToAccount, updateImageToReview, addImagesToReview } = require('../../controllers/image.controller');
const upload = require('../../auth/middlewares/upload.middleware');

// API upload ảnh
router.post('/upload', upload.single('image'), uploadImage);

// API thêm ảnh vào sản phẩm
router.post('/add-image-to-product', addImageToProduct);
// APT thêm ảnh vào account
router.put('/update-image-to-account', updateImageToAccount);


module.exports = router;
