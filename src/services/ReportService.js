const accountModel = require("../models/account.model");
const billModel = require("../models/bill.model");
const productModel = require("../models/product.model");

function getDateRange(filter) {
    const now = new Date();
    let startDate, endDate = now;

    switch (filter) {
        case 'day':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
        case 'week': {
            const day = now.getDay(); // 0 = Chủ Nhật, 1 = Thứ Hai, ..., 6 = Thứ Bảy
            const diff = day === 0 ? -6 : 1 - day; // Nếu là Chủ Nhật thì lùi 6 ngày, còn lại lùi về Thứ Hai
            const monday = new Date(now);
            monday.setDate(now.getDate() + diff);
            startDate = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate());
            break;
        }
        case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
        case 'year':
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
        default:
            startDate = new Date(0); // Lấy tất cả
    }

    return { startDate, endDate };
}


class ReportService {



    static async getAdminReport(filter) {
        const { startDate, endDate } = getDateRange(filter);

        console.log(`Filter: ${filter}, Start Date: ${startDate}, End Date: ${endDate}`);

        console.log("Start Date:", startDate);
        console.log("End Date:", endDate);


        const matchDate = {
            createdAt: { $gte: startDate, $lte: endDate }
        };

        const totalOrders = await billModel.billRepo.countDocuments(matchDate);
        const totalUsers = await accountModel.countDocuments(matchDate);
        const totalProducts = await productModel.countDocuments(matchDate);

        const revenueResult = await billModel.billRepo.aggregate([
            { $match: { status: 'completed', ...matchDate } },
            { $group: { _id: null, total: { $sum: { $add: ['$total', '$shipping_fee'] } } } }
        ]);
        const totalRevenue = revenueResult[0]?.total || 0;

        const topSelling = await billModel.billRepo.aggregate([
            { $match: { status: 'completed', ...matchDate } },
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
                    from: "Products",
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
                    productName: "$productInfo.product_name",
                    productPrice: "$productInfo.product_price",
                    productStock: "$productInfo.product_stock"
                }
            }
        ]);

        const recentOrders = await billModel.billRepo.find(matchDate)
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();


        const debugProducts = await productModel.find({ createdAt: { $gte: startDate, $lte: endDate } });
        console.log("Filtered products:", debugProducts.length);

        const categoryDistribution = await productModel.aggregate([
            { $match: matchDate },
            {
                $group: {
                    _id: "$category",
                    count: { $sum: 1 }
                },
            },
            { $sort: { count: -1 } },
            {
                $lookup: {
                    from: "categories",
                    localField: "_id",
                    foreignField: "_id",
                    as: "categoryInfo"
                },
            },
            { $unwind: "$categoryInfo" },
            {
                $project: {
                    _id: 0,
                    categoryId: "$_id",
                    categoryName: "$categoryInfo.name",
                    count: 1
                }
            }
        ]);

        console.log("categoryDistribution", matchDate, categoryDistribution);


        return {
            totalOrders,
            totalUsers,
            totalProducts,
            totalRevenue,
            topSelling,
            recentOrders,
            categoryDistribution,
        };
    }


    static async getChartData(filter, startDate, endDate) {
        const matchCondition = {};
        const now = new Date();
        let fromDate, toDate;

        switch (filter) {
            case 'day':
            case 'this_month':
                fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
                toDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
                break;
            case 'month':
            case 'this_year':
                fromDate = new Date(now.getFullYear(), 0, 1);
                toDate = new Date(now.getFullYear() + 1, 0, 1);
                break;
            case 'year':
                fromDate = new Date(now.getFullYear() - 5, 0, 1); // ví dụ 5 năm gần đây
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

        let groupBy, totalUnit, labels;

        if (filter === 'day') {
            groupBy = { $dayOfMonth: "$createdAt" };
            totalUnit = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
            labels = Array.from({ length: totalUnit }, (_, i) => `Ngày ${i + 1}`);
        } else if (filter === 'month') {
            groupBy = { $month: "$createdAt" };
            totalUnit = 12;
            labels = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"];
        } else if (filter === 'year') {
            groupBy = { $year: "$createdAt" };
            totalUnit = toDate.getFullYear() - fromDate.getFullYear();
            labels = Array.from({ length: totalUnit }, (_, i) => `${fromDate.getFullYear() + i}`);
        }

        const makeAggregate = async (model, field) => {
            const result = await model.aggregate([
                { $match: { ...matchCondition, ...(field === 'revenue' ? { status: 'completed' } : {}) } },
                {
                    $group: {
                        _id: groupBy,
                        total: field === 'revenue'
                            ? { $sum: { $add: ["$total", "$shipping_fee"] } }
                            : { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]);

            const data = Array(totalUnit).fill(0);
            result.forEach(item => {
                const index = filter === 'year'
                    ? item._id - fromDate.getFullYear()
                    : item._id - 1;
                if (index >= 0 && index < totalUnit) data[index] = item.total;
            });

            return data;
        };

        const [revenueData, orderData, userData] = await Promise.all([
            makeAggregate(billModel.billRepo, 'revenue'),
            makeAggregate(billModel.billRepo, 'orders'),
            makeAggregate(accountModel, 'users')
        ]);

        return {
            success: true,
            data: {
                labels,
                revenueData,
                orderData,
                userData
            }
        };
    }


    // services/ReportService.js
    static async getBasicChartData(filter, startDate, endDate) {
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

        const { revenueData, orderData, userData } = await this.getBasicChartData(filter, startDate, endDate);

        console.log("revenue", revenueData);


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



