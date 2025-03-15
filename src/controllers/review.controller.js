const reviewService = require("../services/review.service");

class ReviewController {
    // Thêm review mới
    static async addReview(req, res) {
        try {
            const { account_id, product_id, contents_review } = req.body;
            const review = await reviewService.addReview(account_id, product_id, contents_review);
            res.status(201).json({ success: true, data: review });
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
            const { contents_review } = req.body;
            const updatedReview = await reviewService.updateReview(reviewId, contents_review);
            res.status(200).json({ success: true, data: updatedReview });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = ReviewController;
