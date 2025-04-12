const Review = require("../models/review.model");
const ReviewReport = require("../models/review_report.model");
const Image = require("../models/image.model");
const User = require("../models/account.model"); // Thêm dòng này
const mongoose = require('mongoose');
class ReviewService {
    static async addReview(account_id, product_id, contents_review, rating, image_ids = []) {
        try {
            // Tìm xem review đã tồn tại chưa
            let existingReview = await Review.findOne({ account_id, product_id });
    
            const now = new Date();
            if (existingReview) {
                // Nếu đã tồn tại → cập nhật lại nội dung
                existingReview.contents_review = contents_review;
                existingReview.rating = rating;
                existingReview.image_ids = image_ids;
                existingReview.updatedAt = now;
    
                await existingReview.save();
            } else {
                // Nếu chưa có → tạo mới
                existingReview = new Review({
                    account_id,
                    product_id,
                    contents_review,
                    rating,
                    image_ids,
                    createdAt: now,
                    updatedAt: now
                });
    
                await existingReview.save();
            }
    
            // Lấy thông tin chi tiết ảnh (nếu có)
            const images = await Image.find({ _id: { $in: image_ids } });
    
            return {
                success: true,
                message: existingReview ? "Review submitted successfully" : "Review added successfully",
                data: {
                    _id: existingReview._id,
                    account_id: existingReview.account_id,
                    product_id: existingReview.product_id,
                    contents_review: existingReview.contents_review,
                    rating: existingReview.rating,
                    createdAt: existingReview.createdAt,
                    updatedAt: existingReview.updatedAt,
                    images: images.map(image => ({
                        _id: image._id,
                        url: image.url,
                        file_name: image.file_name,
                        file_type: image.file_type,
                        file_size: image.file_size
                    }))
                }
            };
        } catch (error) {
            throw new Error("Lỗi khi xử lý review: " + error.message);
        }
    }
    
    
    static async getReviewsByProductId(productId) {
        try {
            // Lấy danh sách review_id đã bị báo cáo
            const reportedReviews = await ReviewReport.find({ status: "reported" }).distinct("review_id");

            // Lọc review hợp lệ
            const reviews = await Review.find({
                product_id: productId,
                _id: { $nin: reportedReviews }
            }).sort({ createdAt: -1 });

            // Lấy thông tin ảnh và người dùng
            const populatedReviews = await Promise.all(reviews.map(async (review) => {
                const images = await Image.find({ _id: { $in: review.image_ids } });
                const user = await User.findById(review.account_id).select("username profile_image"); // Giả sử bảng User có `username`, `avatar`
                const profile_image = await Image.findById(user?.profile_image);

                return {
                    _id: review._id,
                    account_id: review.account_id,
                    username: user?.username || "Ẩn danh",
                    avatar: profile_image ? profile_image.url : "http://localhost:3056/uploads/1741927291394.png",
                    product_id: review.product_id,
                    contents_review: review.contents_review,
                    rating: review.rating, // Trả về rating
                    createdAt: review.createdAt,
                    updatedAt: review.updatedAt,
                    images: images.map(image => ({
                        _id: image._id,
                        url: image.url // Chỉ lấy URL để frontend dễ dùng
                    }))
                };
            }));

            return populatedReviews;
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
    static async updateReview(reviewId, contents_review, rating, image_ids) {
        try {
            const updateData = {};
            if (contents_review) updateData.contents_review = contents_review;
            if (rating) updateData.rating = rating; // Cập nhật rating
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
                    rating: updatedReview.rating, // Trả về rating
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
    // Thống kê số lượng người đánh giá và trung bình sao
    static async getReviewStatsByProductId(productId) {
        try {
            // Chuyển productId thành ObjectId (chắc chắn sử dụng đúng cú pháp)
            const productObjectId = new mongoose.Types.ObjectId(productId); // Đảm bảo sử dụng đúng cú pháp
    
            const stats = await Review.aggregate([
                { $match: { product_id: productObjectId } }, // Lọc theo sản phẩm (chuyển đổi productId thành ObjectId)
                {
                    $group: {
                        _id: "$product_id",
                        totalReviews: { $sum: 1 },                  // Tổng số đánh giá
                        averageRating: { $avg: "$rating" }          // Trung bình rating
                    }
                }
            ]);
    
            if (stats.length === 0) {
                return {
                    totalReviews: 0,
                    averageRating: 0
                };
            }
    
            // Làm tròn số sao trung bình đến 1 chữ số sau dấu phẩy
            const averageRating = Math.round(stats[0].averageRating * 10) / 10;
    
            return {
                totalReviews: stats[0].totalReviews,
                averageRating
            };
        } catch (error) {
            throw new Error("Lỗi khi thống kê đánh giá: " + error.message);
        }
    }
}

module.exports = ReviewService;
