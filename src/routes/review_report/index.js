const express = require("express");
const router = express.Router();
const ReviewReportController = require("../../controllers/review_report.controler");
const { apiKey, permissions } = require("../../auth/checkAuth");

// Routes
router.post("/add", ReviewReportController.addReviewReport);
router.get("/list", ReviewReportController.getAllReports);
router.patch("/status/:id", ReviewReportController.updateReportStatus);

module.exports = router;
