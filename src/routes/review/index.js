const express = require("express");
const router = express.Router();
const ReviewController = require("../../controllers/review.controller");
const { apiKey, permissions } = require("../../auth/checkAuth");


// Thêm review mới
router.post("/add", ReviewController.addReview);
// Lấy tất cả review
router.get("/getAll", ReviewController.getAllReviews);
// Lấy danh sách review theo accountId và productId
router.get("/getReview/:accountId/:productId", ReviewController.getReviews);

// Cập nhật nội dung review theo reviewId
router.put("/update/:reviewId", ReviewController.updateReview);



module.exports = router;
