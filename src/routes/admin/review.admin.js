// File: routes/admin/review.routes.js
const express = require("express");
const ReviewController = require("../../controllers/review.controller");
const router = express.Router();


// Route để lấy trang quản lý đánh giá
router.get("/list", ReviewController.getReviewManagementPage);

router.get("/:id", ReviewController.getReviewById);


// Route để cập nhật trạng thái của một đánh giá
router.put("/:id/status", ReviewController.updateReviewStatus);

// Route để xóa một đánh giá
router.delete("/:id", ReviewController.deleteReview);

// Route để cập nhật trạng thái của một báo cáo đánh giá
router.put("/report/:id/status", ReviewController.updateReportStatus);

// Route để xóa một báo cáo đánh giá
router.get("/report/:id", ReviewController.getReportDetail);
router.delete("/report/:id", ReviewController.deleteReport);

router.get("/:id/detail", ReviewController.getReviewDetailPage);




module.exports = router;
