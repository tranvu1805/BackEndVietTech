const Review = require("../models/review.model");
const ReviewReport = require("../models/review_report.model");
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
    // Lấy tất cả review của một sản phẩm theo product_id với trạng thái active và không bị báo cáo
    static async getReviewsByProductId(productId) {
        try {
            // Lấy danh sách review_id đã bị báo cáo
            const reportedReviews = await ReviewReport.find({ status: "reported" }).distinct("review_id");
    
            // Lọc ra các review chưa bị báo cáo
            const reviews = await Review.find({ 
                product_id: productId, 
                _id: { $nin: reportedReviews } // Loại bỏ review bị báo cáo
            });
    
            return reviews;
        } catch (error) {
            throw new Error("Lỗi khi lấy danh sách review của sản phẩm: " + error.message);
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
