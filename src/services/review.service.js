const Review = require("../models/review.model");

class ReviewService {
    // Thêm review mới
    static async addReview(account_id, product_id, contents_review) {
        try {
            const newReview = new Review({ account_id, product_id, contents_review });
            return await newReview.save();
        } catch (error) {
            throw new Error("Lỗi khi thêm review: " + error.message);
        }
    }
    // Lấy tất cả review
    static async getAllReviews() {
        try {
            return await Review.find();
        } catch (error) {
            throw new Error("Lỗi khi lấy danh sách review: " + error.message);
        }
    }
    // Lấy danh sách review theo account_id và product_id
    static async getReviewsByAccountAndProduct(accountId, productId) {
        try {
            return await Review.find({ account_id: accountId, product_id: productId });
        } catch (error) {
            throw new Error("Lỗi khi lấy danh sách review: " + error.message);
        }
    }

    // Cập nhật nội dung review theo reviewId
    static async updateReview(reviewId, contents_review) {
        try {
            return await Review.findByIdAndUpdate(
                reviewId,
                { contents_review, updatedAt: new Date() },
                { new: true }
            );
        } catch (error) {
            throw new Error("Lỗi khi cập nhật review: " + error.message);
        }
    }
}

module.exports = ReviewService;
