const reviewModel = require("../models/review.model");
const review_reportModel = require("../models/review_report.model");
const reviewService = require("../services/review.service");
const mongoose = require('mongoose');
class ReviewController {
    // Thêm review mới
    static async addReview(req, res) {
        try {
            const { account_id, product_id, contents_review, rating, image_ids } = req.body;

            // Kiểm tra rating có hợp lệ không
            if (typeof rating !== 'number' || rating < 1 || rating > 5) {
                return res.status(400).json({ success: false, message: "Rating phải là một số trong khoảng từ 1 đến 5" });
            }

            const review = await reviewService.addReview(account_id, product_id, contents_review, rating, image_ids);
            res.status(201).json({ success: true, data: review });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // Lấy danh sách review theo product_id (chỉ lấy review active và không bị báo cáo)
    static async getReviewsByProduct(req, res) {
        try {
            const { productId } = req.params;
            const reviews = await reviewService.getReviewsByProductId(productId);
            res.status(200).json({ success: true, data: reviews });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // Lấy tất cả review
    static async getAllReviews(req, res) {
        try {
            const reviews = await reviewService.getAllReviews();
            res.status(200).json({ success: true, data: reviews });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // Lấy danh sách review theo account_id và product_id
    static async getReviews(req, res) {
        try {
            const { accountId, productId } = req.params;
            const reviews = await reviewService.getReviewsByAccountAndProduct(accountId, productId);
            res.status(200).json({ success: true, data: reviews });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // Cập nhật review theo reviewId
    static async updateReview(req, res) {
        try {
            const { reviewId } = req.params;
            const { contents_review, rating, image_ids } = req.body; // Lấy dữ liệu từ body

            // Kiểm tra rating có hợp lệ không
            if (rating && (typeof rating !== 'number' || rating < 1 || rating > 5)) {
                return res.status(400).json({ success: false, message: "Rating phải là một số trong khoảng từ 1 đến 5" });
            }

            const updatedReview = await reviewService.updateReview(reviewId, contents_review, rating, image_ids);

            if (!updatedReview) {
                return res.status(404).json({ success: false, message: "Không tìm thấy review để cập nhật" });
            }

            res.status(200).json({ success: true, data: updatedReview });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    // Lấy thống kê số lượng đánh giá và trung bình sao theo product_id
    // Thống kê số lượng người đánh giá và trung bình sao
    static async getReviewStatsByProduct(req, res) {
        try {
            const { productId } = req.params;
            const stats = await reviewService.getReviewStatsByProductId(productId);

            res.status(200).json({ success: true, data: stats });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async getReviewManagementPage(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const reportPage = parseInt(req.query.reportPage) || 1;
            const limit = 10;

            const [totalReviews, reviews, totalReports, reports] = await Promise.all([
                reviewModel.countDocuments(),
                reviewModel.find()
                    .populate("account_id", "username")
                    .populate("product_id", "product_name")
                    .populate("image_ids", "url")
                    .sort({ createdAt: -1 })
                    .skip((page - 1) * limit)
                    .limit(limit)
                    .lean(),
                review_reportModel.countDocuments(),
                review_reportModel.find()
                    .populate("account_id", "username")
                    .populate("review_id", "contents_review")
                    .sort({ createdAt: -1 })
                    .skip((reportPage - 1) * limit)
                    .limit(limit)
                    .lean()
            ]);

            res.render("admin/review-list", {
                reviews,
                reports,
                totalReviewPages: Math.ceil(totalReviews / limit),
                totalReportPages: Math.ceil(totalReports / limit),
                currentReviewPage: page,
                currentReportPage: reportPage,
                totalReviews,
                totalReports,
                query: req.query
            });
        } catch (err) {
            console.error("Lỗi khi load trang quản lý đánh giá:", err);
            res.status(500).send("Đã xảy ra lỗi.");
        }
    }



}

module.exports = ReviewController;
