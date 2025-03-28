const Review = require("../models/review.model");
const ReviewReport = require("../models/review_report.model");
const Image = require("../models/image.model"); 

class ReviewService {
    static async addReview(account_id, product_id, contents_review, image_ids = []) {
        try {
            const newReview = new Review({ 
                account_id, 
                product_id, 
                contents_review, 
                image_ids  // Lưu danh sách ảnh nếu có
            });
    
            await newReview.save();
    
            // Lấy thông tin chi tiết của ảnh nếu có
            const images = await Image.find({ _id: { $in: image_ids } });
    
            return {
                success: true,
                message: "Review added successfully",
                data: {
                    _id: newReview._id,
                    account_id: newReview.account_id,
                    product_id: newReview.product_id,
                    contents_review: newReview.contents_review,
                    createdAt: newReview.createdAt,
                    updatedAt: newReview.updatedAt,
                    images: images.map(image => ({
                        _id: image._id,
                        file_name: image.file_name,
                        file_path: image.file_path,
                        file_size: image.file_size,
                        file_type: image.file_type,
                        url: image.url,
                        uploaded_at: image.uploaded_at,
                        createdAt: image.createdAt,
                        updatedAt: image.updatedAt,
                        __v: image.__v
                    }))
                }
            };
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
static async updateReview(reviewId, contents_review, image_ids) {
    try {
        const updateData = {};
        if (contents_review) updateData.contents_review = contents_review;
        if (image_ids) updateData.image_ids = image_ids;
        updateData.updatedAt = new Date(); // Cập nhật thời gian chỉnh sửa

        const updatedReview = await Review.findByIdAndUpdate(
            reviewId,
            updateData,
            { new: true }
        );

        if (!updatedReview) {
            throw new Error("Không tìm thấy review để cập nhật!");
        }

        // Lấy thông tin chi tiết của các ảnh nếu có
        const images = await Image.find({ _id: { $in: updatedReview.image_ids } });

        return {
            success: true,
            message: "Review updated successfully",
            data: {
                _id: updatedReview._id,
                account_id: updatedReview.account_id,
                product_id: updatedReview.product_id,
                contents_review: updatedReview.contents_review,
                createdAt: updatedReview.createdAt,
                updatedAt: updatedReview.updatedAt,
                images: images.map(image => ({
                    _id: image._id,
                    file_name: image.file_name,
                    file_path: image.file_path,
                    file_size: image.file_size,
                    file_type: image.file_type,
                    url: image.url,
                    uploaded_at: image.uploaded_at,
                    createdAt: image.createdAt,
                    updatedAt: image.updatedAt,
                    __v: image.__v
                }))
            }
        };
    } catch (error) {
        throw new Error("Lỗi khi cập nhật review: " + error.message);
    }
}

}

module.exports = ReviewService;
