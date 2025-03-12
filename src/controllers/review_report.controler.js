const ReviewReportService = require("../services/review_report.service");

class ReviewReportController {
    // Thêm báo cáo review
    static async addReviewReport(req, res) {
        try {
            const { review_id, reason } = req.body;
            const user_id = req.user.id; // Lấy ID user từ token
            const report = await ReviewReportService.addReviewReport(review_id, user_id, reason);
            res.json({ success: true, message: "Báo cáo review thành công", report });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // Lấy danh sách báo cáo review (Admin)
    static async getAllReports(req, res) {
        try {
            const reports = await ReviewReportService.getAllReports();
            res.json({ success: true, reports });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // Cập nhật trạng thái báo cáo review (Admin)
    static async updateReportStatus(req, res) {
        try {
            const { status } = req.body;
            const { id } = req.params;
            if (!["pending", "resolved", "rejected"].includes(status)) {
                return res.status(400).json({ success: false, message: "Trạng thái không hợp lệ" });
            }
            const report = await ReviewReportService.updateReportStatus(id, status);
            res.json({ success: true, message: "Cập nhật trạng thái thành công", report });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = ReviewReportController;
