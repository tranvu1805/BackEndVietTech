// routes/admin/reports.admin.js
const express = require("express");
const ReportService = require("../../services/ReportService");

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const report = await ReportService.getAdminReport();
        res.render('admin/admin-report', { report });
    } catch (err) {
        console.error('❌ Lỗi tải trang báo cáo:', err);
        res.status(500).send('Lỗi khi tải trang báo cáo');
    }
});

router.get('/data', async (req, res) => {
    try {
        const report = await ReportService.getAdminReport();
        res.json({ success: true, report });
    } catch (err) {
        console.error('❌ Lỗi tải dữ liệu báo cáo:', err);
        res.status(500).json({ success: false, message: 'Lỗi khi tải dữ liệu báo cáo' });
    }
});

router.get('/chart-data', async (req, res) => {
    try {
        const { filter, startDate, endDate } = req.query;
        const data = await ReportService.getChartData(filter, startDate, endDate);
        res.json({ success: true, data });
    } catch (error) {
        console.error("Error loading chart data:", error);
        res.status(500).json({ success: false, message: 'Lỗi tải dữ liệu biểu đồ' });
    }
});

router.get('/advanced-dashboard', async (req, res) => {
    try {
        const { filter, startDate, endDate, view, comparisonView } = req.query;

        console.log(`Advanced dashboard filter: ${filter}, startDate: ${startDate}, endDate: ${endDate}, view: ${view}, comparisonView: ${comparisonView}`);


        // Get basic dashboard data
        const report = await ReportService.getAdminReport();

        // Get detailed dashboard data
        const dashboardData = await ReportService.getAdvancedDashboard(filter, startDate, endDate);

        // Combine all data
        const data = {
            ...dashboardData,
            totalOrders: report.totalOrders,
            totalUsers: report.totalUsers,
            totalProducts: report.totalProducts,
            totalRevenue: report.totalRevenue
        };

        // Log data size for debugging
        const dataSize = JSON.stringify(data).length;
        console.log(`Advanced dashboard data size: ${dataSize} bytes`);

        res.json({ success: true, data });
    } catch (error) {
        console.error("Lỗi lấy dashboard nâng cao:", error);
        res.status(500).json({ success: false, message: 'Lỗi server: ' + error.message });
    }
});

// Add export endpoint
router.get('/export', async (req, res) => {
    try {
        const { filter, startDate, endDate } = req.query;

        // In a real implementation, generate an Excel/CSV file using data from services
        // For demonstration, we'll just send a success message

        // Get report data
        const report = await ReportService.getAdminReport();
        const chartData = await ReportService.getChartData(filter, startDate, endDate);
        const advancedData = await ReportService.getAdvancedDashboard(filter, startDate, endDate);

        // This would normally use a library like ExcelJS or json2csv to generate the file
        // For now, simulate a delay and send a simple text response
        setTimeout(() => {
            setTimeout(() => {
                res.setHeader('Content-Type', 'application/octet-stream');
                res.setHeader('Content-Disposition', `attachment; filename=report-${new Date().toISOString().split('T')[0]}.txt`);

                const reportText = `
            BÁO CÁO HỆ THỐNG
            Thời gian xuất: ${new Date().toLocaleString('vi-VN')}
            Filter: ${filter}
            ${startDate && endDate ? `Từ ngày: ${startDate} đến ngày: ${endDate}` : ''}
            
            --- TỔNG QUAN ---
            Tổng đơn hàng: ${report.totalOrders}
            Tổng người dùng: ${report.totalUsers}
            Tổng sản phẩm: ${report.totalProducts}
            Tổng doanh thu: ${report.totalRevenue.toLocaleString('vi-VN')} VND
            
            --- DOANH THU THEO THÁNG ---
            ${chartData.revenueData.map((value, index) => `Tháng ${index + 1}: ${value.toLocaleString('vi-VN')} VND`).join('\n')}
            
            --- SỐ ĐƠN HÀNG THEO THÁNG ---
            ${chartData.orderData.map((value, index) => `Tháng ${index + 1}: ${value} đơn`).join('\n')}
            
            --- NGƯỜI DÙNG MỚI THEO THÁNG ---
            ${chartData.userData.map((value, index) => `Tháng ${index + 1}: ${value} người dùng`).join('\n')}
            
            --- DOANH THU THEO NGÀY (Từ advancedData) ---
            ${advancedData.revenueByDay.map(d => `Ngày ${String(d._id.day).padStart(2, '0')}/${String(d._id.month).padStart(2, '0')}: ${Math.round(d.total).toLocaleString('vi-VN')} VND`).join('\n')}
            
            --- TOP SẢN PHẨM BÁN CHẠY ---
            ${advancedData.topProducts.map(p => `• ${p.productName} - ${p.quantity} sản phẩm`).join('\n')}
            
            --- KHÁCH HÀNG CHI TIÊU NHIỀU NHẤT ---
            ${advancedData.topCustomers.map(c => `• ${c.name || c.userId} - ${c.totalSpent.toLocaleString('vi-VN')} VND (${c.orderCount} đơn)`).join('\n')}
                `;

                res.send(reportText);
            }, 1000)
        });

    } catch (error) {
        console.error("Error exporting report:", error);
        res.status(500).json({ success: false, message: 'Lỗi khi xuất báo cáo: ' + error.message });
    }
});

module.exports = router;