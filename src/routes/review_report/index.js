const express = require("express");
const router = express.Router();
const ReviewReportController = require("../../controllers/review_report.controler");
const { apiKey, permissions } = require("../../auth/checkAuth");
const {authentication}=require("../../auth/authUtils")

router.get("/list", ReviewReportController.getAllReports);

router.use(authentication)

// Routes
router.post("/add", ReviewReportController.addReviewReport);
router.patch("/status/:id", ReviewReportController.updateReportStatus);

module.exports = router;
