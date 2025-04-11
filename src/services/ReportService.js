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
    static async getChartData(filter, startDate, endDate) {
        const matchCondition = {};

        // Xử lý lọc thời gian
        const now = new Date();
        let fromDate, toDate;

        switch (filter) {
            case 'this_month':
                fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
                toDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
                break;
            case 'last_month':
                fromDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                toDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'this_year':
                fromDate = new Date(now.getFullYear(), 0, 1);
                toDate = new Date(now.getFullYear() + 1, 0, 1);
                break;
            case 'last_year':
                fromDate = new Date(now.getFullYear() - 1, 0, 1);
                toDate = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                if (startDate && endDate) {
                    fromDate = new Date(startDate);
                    toDate = new Date(endDate);
                    toDate.setDate(toDate.getDate() + 1); // Bao gồm cả ngày kết thúc
                }
        }

        if (fromDate && toDate) {
            matchCondition.createdAt = { $gte: fromDate, $lt: toDate };
        }

        // 1. Doanh thu theo tháng
        const revenueResult = await billModel.billRepo.aggregate([
            { $match: { ...matchCondition, status: 'completed' } },
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
            { $match: matchCondition },
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
            { $match: matchCondition },
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



    static async getAdvancedDashboard(filter, startDate, endDate) {
        const matchCondition = {};
        const now = new Date();
        let fromDate, toDate;

        switch (filter) {
            case 'today':
                fromDate = new Date(now.setHours(0, 0, 0, 0));
                toDate = new Date(now.setHours(23, 59, 59, 999));
                break;
            case 'this_week':
                const day = now.getDay() || 7;
                fromDate = new Date(now);
                fromDate.setDate(now.getDate() - day + 1);
                fromDate.setHours(0, 0, 0, 0);
                toDate = new Date(fromDate);
                toDate.setDate(fromDate.getDate() + 7);
                break;
            case 'this_month':
                fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
                toDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
                break;
            case 'last_month':
                fromDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                toDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'this_year':
                fromDate = new Date(now.getFullYear(), 0, 1);
                toDate = new Date(now.getFullYear() + 1, 0, 1);
                break;
            default:
                if (startDate && endDate) {
                    fromDate = new Date(startDate);
                    toDate = new Date(endDate);
                    toDate.setDate(toDate.getDate() + 1);
                }
        }

        if (fromDate && toDate) {
            matchCondition.createdAt = { $gte: fromDate, $lt: toDate };
        }

        const [
            revenueByDay,
            revenueByHour,
            topProducts,
            lowSellingProducts,
            topCustomers
        ] = await Promise.all([
            billModel.billRepo.aggregate([
                { $match: { ...matchCondition, status: 'completed' } },
                {
                    $group: {
                        _id: {
                            day: { $dayOfMonth: "$createdAt" },
                            month: { $month: "$createdAt" },
                            year: { $year: "$createdAt" } // thêm năm nếu lọc theo `this_year`
                        },
                        total: { $sum: { $add: ["$total", "$shipping_fee"] } }
                    }
                },
                { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
            ]),
            

            billModel.billRepo.aggregate([
                { $match: { ...matchCondition, status: 'completed' } },
                { $group: { _id: { $hour: "$createdAt" }, total: { $sum: { $add: ["$total", "$shipping_fee"] } } } },
                { $sort: { _id: 1 } }
            ]),

            billModel.billRepo.aggregate([
                { $match: { ...matchCondition, status: 'completed' } },
                { $unwind: "$products" },
                {
                    $group: {
                        _id: "$products.productId",
                        quantity: { $sum: "$products.quantity" }
                    }
                },
                { $sort: { quantity: -1 } },
                { $limit: 5 },
                {
                    $lookup: {
                        from: "Products", // Tên collection (viết thường) bạn dùng trong MongoDB
                        localField: "_id",
                        foreignField: "_id",
                        as: "productInfo"
                    }
                },
                { $unwind: "$productInfo" },
                {
                    $project: {
                        _id: 0,
                        productId: "$_id",
                        quantity: 1,
                        productName: "$productInfo.product_name" // hoặc đổi tên trường cho phù hợp
                    }
                }
            ]),

            // Sản phẩm bán ế (bottom 5)
            billModel.billRepo.aggregate([
                { $match: { ...matchCondition, status: "completed" } },
                { $unwind: "$products" },
                {
                    $group: {
                        _id: "$products.productId",
                        quantity: { $sum: "$products.quantity" }
                    }
                },
                { $sort: { quantity: 1 } },
                { $limit: 5 },
                {
                    $lookup: {
                        from: "Products", // ✅ dùng đúng tên collection
                        localField: "_id",
                        foreignField: "_id",
                        as: "productInfo"
                    }
                },
                {
                    $unwind: {
                        path: "$productInfo",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $project: {
                        _id: 0,
                        productId: "$_id",
                        quantity: 1,
                        product_name: "$productInfo.product_name"
                    }
                }
            ]),



            // Khách hàng chi tiêu nhiều nhất
            billModel.billRepo.aggregate([
                { $match: { ...matchCondition, status: 'completed' } },
                {
                    $group: {
                        _id: "$user_id", // ✅ Sử dụng đúng tên trường trong schema
                        totalSpent: { $sum: { $add: ["$total", "$shipping_fee"] } },
                        orderCount: { $sum: 1 }
                    }
                },
                { $sort: { totalSpent: -1 } },
                { $limit: 5 },
                {
                    $lookup: {
                        from: "accounts", // hoặc tên collection người dùng của bạn
                        localField: "_id",
                        foreignField: "_id",
                        as: "userInfo"
                    }
                },
                {
                    $unwind: {
                        path: "$userInfo",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $project: {
                        _id: 0,
                        userId: "$_id",
                        name: "$userInfo.name",
                        email: "$userInfo.email",
                        totalSpent: 1,
                        orderCount: 1
                    }
                }
            ])

        ]);

        const { revenueData, orderData, userData } = await this.getChartData(filter, startDate, endDate);

        return {
            revenueByDay,
            revenueByHour,
            topProducts,
            lowSellingProducts,
            topCustomers,
            revenueData,
            orderData,
            userData
        };
    }

}

module.exports = ReportService;



