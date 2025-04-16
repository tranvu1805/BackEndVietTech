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

    static async getReviewById(req, res) {
        try {
            const { id } = req.params;
            const review = await reviewModel.findById(id)
                .populate("account_id", "username email")
                .populate("product_id", "product_name")
                .populate("image_ids", "url")
                .lean();

            if (!review) {
                return res.status(404).json({ success: false, message: "Không tìm thấy đánh giá" });
            }

            res.status(200).json({ success: true, data: review });
        } catch (error) {
            console.error("Lỗi getReviewById:", error);
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

            // Kiểm tra nội dung review (có thể thêm kiểm tra độ dài hoặc nội dung hợp lệ)
            if (contents_review && contents_review.trim().length === 0) {
                return res.status(400).json({ success: false, message: "Nội dung đánh giá không được trống" });
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
            const {
                page = 1,
                reportPage = 1,
                sort = "latest",
                rating,
                reportSort = "latest",
                reportStatus,
                search
            } = req.query;

            const pageNum = parseInt(page);
            const reportPageNum = parseInt(reportPage);
            const limit = 10;

            // ==== ĐÁNH GIÁ SẢN PHẨM ====
            // Tạo điều kiện lọc đánh giá
            const reviewFilter = {};
            if (rating) {
                const ratingNum = parseInt(rating);
                if (!isNaN(ratingNum)) {
                    reviewFilter.rating = ratingNum;
                }
            }
            if (search) {
                reviewFilter.contents_review = { $regex: search, $options: "i" };
            }

            // Tạo điều kiện sắp xếp
            let reviewSortOption = { createdAt: -1 }; // mặc định: mới nhất
            if (sort === "highest") reviewSortOption = { rating: -1 };
            else if (sort === "lowest") reviewSortOption = { rating: 1 };

            // Truy vấn đánh giá
            const [totalReviews, reviews] = await Promise.all([
                reviewModel.countDocuments(reviewFilter),
                reviewModel.find(reviewFilter)
                    .populate("account_id", "username")
                    .populate("product_id", "product_name")
                    .populate("image_ids", "url")
                    .sort(reviewSortOption)
                    .skip((pageNum - 1) * limit)
                    .limit(limit)
                    .lean()
            ]);

            // ==== BÁO CÁO ĐÁNH GIÁ ====
            const reportFilter = {};
            if (reportStatus === "Đã xử lý") {
                reportFilter.status = "active";
            } else if (reportStatus === "Đang chờ") {
                reportFilter.status = { $ne: "active" }; // chưa duyệt
            }

            let reportSortOption = { createdAt: -1 }; // mới nhất
            if (reportSort === "oldest") reportSortOption = { createdAt: 1 };

            const [totalReports, reports] = await Promise.all([
                review_reportModel.countDocuments(reportFilter),
                review_reportModel.find(reportFilter)
                    .populate("account_id", "username")
                    .populate({
                        path: "review_id",
                        select: "contents_review"
                    })
                    .sort(reportSortOption)
                    .skip((reportPageNum - 1) * limit)
                    .limit(limit)
                    .lean()
            ]);

            // Render trang quản lý
            res.render("admin/review-list", {
                reviews,
                reports,
                totalReviewPages: Math.ceil(totalReviews / limit),
                totalReportPages: Math.ceil(totalReports / limit),
                currentReviewPage: pageNum,
                currentReportPage: reportPageNum,
                totalReviews,
                totalReports,
                query: req.query
            });
        } catch (err) {
            console.error("Lỗi khi load trang quản lý đánh giá:", err);
            res.status(500).send("Đã xảy ra lỗi.");
        }
    }


    // Cập nhật trạng thái của một đánh giá
    static async updateReviewStatus(req, res) {
        try {
            const { id } = req.params; // Lấy id của review từ params
            const { status } = req.body; // Lấy trạng thái mới từ body

            // Kiểm tra trạng thái hợp lệ
            if (!status) {
                return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
            }

            const updatedReview = await reviewModel.findByIdAndUpdate(id, { status }, { new: true });

            if (!updatedReview) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy review để cập nhật' });
            }

            res.status(200).json({ success: true, data: updatedReview });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }


    static async deleteReview(req, res) {
        try {
            const { id } = req.params;
            await reviewModel.findByIdAndDelete(id);
            res.status(200).json({ success: true, message: "Xóa đánh giá thành công" });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async updateReportStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            if (!status) {
                return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
            }

            const updatedReport = await review_reportModel.findByIdAndUpdate(id, { status }, { new: true });

            if (!updatedReport) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy báo cáo để cập nhật' });
            }

            res.status(200).json({ success: true, data: updatedReport });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async deleteReport(req, res) {
        try {
            const { id } = req.params;
            await review_reportModel.findByIdAndDelete(id);
            res.status(200).json({ success: true, message: "Xóa báo cáo thành công" });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async getReviewDetailPage(req, res) {
        try {
            const { id } = req.params;

            const review = await reviewModel.findById(id)
                .populate("account_id", "username email")
                .populate("product_id", "product_name")
                .populate("image_ids", "url")
                .lean();

            if (!review) {
                return res.status(404).send("Không tìm thấy đánh giá");
            }

            res.render("admin/review-detail", { review });
        } catch (err) {
            console.error("Lỗi khi lấy chi tiết đánh giá:", err);
            res.status(500).send("Đã xảy ra lỗi.");
        }
    }

    static async getReportDetail(req, res) {
        try {
            const { id } = req.params;
            const report = await review_reportModel.findById(id)
                .populate('account_id', 'username email')
                .populate({
                    path: 'review_id',
                    populate: {
                        path: 'account_id',
                        select: 'username'
                    },
                    select: 'contents_review account_id'
                });

            if (!report) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy báo cáo' });
            }

            res.status(200).json({ success: true, data: report });
        } catch (err) {
            console.error(err);
            res.status(500).json({ success: false, message: 'Lỗi server' });
        }
    }



}

module.exports = ReviewController;
