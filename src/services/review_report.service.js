const ReviewReport = require("../models/review_report.model");

class ReviewReportService {
    // Thêm báo cáo review
    static async addReviewReport(review_id, account_id, reason) {
        return await ReviewReport.create({ review_id, account_id, reason });
    }

    // Lấy danh sách báo cáo
    static async getAllReports() {
        return await ReviewReport.find().populate("review_id account_id", "contents_review username full_name");
    }

    // Cập nhật trạng thái báo cáo (chỉ Admin)
    static async updateReportStatus(report_id, status) {
        return await ReviewReport.findByIdAndUpdate(report_id, { status }, { new: true });
    }
}

module.exports = ReviewReportService;
