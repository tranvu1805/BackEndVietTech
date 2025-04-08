const express = require("express");
const ReportService = require("../../services/ReportService");

const router = express.Router();



router.get('/', async (req, res) => {
    try {
        const report = await ReportService.getAdminReport(); // Gọi service để lấy dữ liệu
        res.render('admin/admin-report', { report }); // Hiển thị ra view report.ejs
    } catch (err) {
        console.error('❌ Lỗi tải trang báo cáo:', err);
        res.status(500).send('Lỗi khi tải trang báo cáo');
    }
});

router.get('/data', async (req, res) => {
    try {
        const report = await ReportService.getAdminReport(); // Gọi service để lấy dữ liệu
        res.json({ report }); // Trả về dữ liệu dưới dạng JSON
    } catch (err) {
        console.error('❌ Lỗi tải trang báo cáo:', err);
        res.status(500).send('Lỗi khi tải trang báo cáo');
    }
});

router.get('/chart-data', async (req, res) => {
    try {
        const data = await ReportService.getChartData(); // service trả dữ liệu theo tháng
        console.log("📊 Dữ liệu biểu đồ:", data);
        
        res.json({ success: true, data });
    } catch (error) {
        console.error("Error loading chart data:", error);
        res.status(500).json({ success: false, message: 'Lỗi tải dữ liệu biểu đồ' });
    }
});



// routes/admin/reports.admin.js


module.exports = router;