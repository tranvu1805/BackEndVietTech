// File: routes/admin/review.routes.js
const express = require("express");
const ReviewController = require("../../controllers/review.controller");
const router = express.Router();


router.get("/list", ReviewController.getReviewManagementPage);
// router.put("/:id/status", reviewController.updateReviewStatus);
// router.delete("/:id", reviewController.deleteReview);

// router.put("/report/:id/status", reviewController.updateReportStatus);
// router.delete("/report/:id", reviewController.deleteReport);

module.exports = router;