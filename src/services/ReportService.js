const accountModel = require("../models/account.model");
const billModel = require("../models/bill.model");
const productModel = require("../models/product.model");

class ReportService {

    static async getAdminReport() {
        const totalOrders = await billModel.billRepo.countDocuments();
        const totalUsers = await accountModel.countDocuments();
        const totalProducts = await productModel.countDocuments();
        const revenueResult = await billModel.billRepo.aggregate([
            { $match: { status: 'completed' } },
            { $group: { _id: null, total: { $sum: { $add: ['$total', '$shipping_fee'] } } } }
        ]);
        const totalRevenue = revenueResult[0]?.total || 0;

        return {
            totalOrders,
            totalUsers,
            totalProducts,
            totalRevenue
        };
    }

    // services/ReportService.js
    static async getChartData() {
        // 1. Doanh thu theo tháng
        const revenueResult = await billModel.billRepo.aggregate([
            { $match: { status: 'completed' } },
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    totalRevenue: { $sum: { $add: ['$total', '$shipping_fee'] } }
                }
            },
            { $sort: { "_id": 1 } }
        ]);
        const revenueData = Array(12).fill(0);
        revenueResult.forEach(item => {
            revenueData[item._id - 1] = item.totalRevenue;
        });

        // 2. Đơn hàng theo tháng
        const orderResult = await billModel.billRepo.aggregate([
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    totalOrders: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);
        const orderData = Array(12).fill(0);
        orderResult.forEach(item => {
            orderData[item._id - 1] = item.totalOrders;
        });

        // 3. Người dùng đăng ký theo tháng
        const userResult = await accountModel.aggregate([
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    totalUsers: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);
        const userData = Array(12).fill(0);
        userResult.forEach(item => {
            userData[item._id - 1] = item.totalUsers;
        });

        return {
            revenueData,
            orderData,
            userData
        };
    }


}

module.exports = ReportService;



