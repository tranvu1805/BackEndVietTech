// controllers/log.controller.js
const logModel = require('../models/log.model');

class LogController {
    // Lấy danh sách log
    async getLogs(req, res) {
        try {
            const { page = 1, limit = 10 } = req.query;
            const skip = (page - 1) * limit;
            const logs = await logModel.find()
                .populate('userId', 'username')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);
            const totalLogs = await logModel.countDocuments();
            res.status(200).json({
                logs,
                totalPages: Math.ceil(totalLogs / limit),
                currentPage: page,
            });
        } catch (error) {
            console.error('Error fetching logs:', error);
            res.status(500).json({ message: 'Error fetching logs' });
        }
    }

    getRecentLogs = async (req, res) => {
        try {
            const logs = await logModel.find()
                .sort({ changed_at: -1 })
                .limit(5)
                .populate('changed_by', 'full_name') // Lấy tên người thay đổi
                .lean();

            res.status(200).json({ success: true, logs });
        } catch (err) {
            console.error("Lỗi khi lấy logs:", err);
            res.status(500).json({ success: false, message: "Lỗi server" });
        }
    }
}

module.exports = new LogController();