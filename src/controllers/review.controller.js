const reviewService = require("../services/review.service");

class ReviewController {
    // Thêm review mới
    static async addReview(req, res) {
        try {
            const { account_id, product_id, contents_review , image_ids} = req.body;
            const review = await reviewService.addReview(account_id, product_id, contents_review, image_ids);
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
        const { contents_review, image_ids } = req.body; // Lấy dữ liệu từ body

        const updatedReview = await reviewService.updateReview(reviewId, contents_review, image_ids);
        
        if (!updatedReview) {
            return res.status(404).json({ success: false, message: "Không tìm thấy review để cập nhật" });
        }

        res.status(200).json({ success: true, data: updatedReview });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

 

}

module.exports = ReviewController;
