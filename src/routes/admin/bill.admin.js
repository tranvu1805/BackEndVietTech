const express = require("express");
const {
    getAllBills_Admin,
    exportBillsToExcel,
} = require("../../controllers/bill.controller");
const BillController = require("../../controllers/bill.controller");
const asyncHandler = require("../../helpers/asyncHandler");
const billModel = require("../../models/bill.model");
const router = express.Router();


router.get("/", async (req, res) => {
    try {
        const { search, status, payment_method, start_date, end_date, page = 1, limit = 8 } = req.query;

        const result = await getAllBills_Admin({ search, status, payment_method, start_date, end_date, page, limit });

        res.render("admin/bill-list", {
            bills: result.bills,
            currentPage: result.currentPage,
            totalPages: result.totalPages,
            totalItems: result.totalItems,
            search,
            status,
            payment_method,
            start_date,
            end_date,
            limit,
            errorMessage: null // không có lỗi
        });
    } catch (error) {
        console.error("Lỗi khi tải đơn hàng:", error.message);
        res.render("admin/bill-list", {
            bills: [],
            currentPage: 1,
            totalPages: 1,
            totalItems: 0,
            search: req.query.search || '',
            status: req.query.status || '',
            payment_method: req.query.payment_method || '',
            start_date: req.query.start_date || '',
            end_date: req.query.end_date || '',
            limit: req.query.limit || 10,
            errorMessage: "Đã xảy ra lỗi khi tải danh sách đơn hàng. Vui lòng thử lại sau."
        });
    }
});


router.get('/all-bills', async (req, res) => {
    try {
        const orders = await billModel.billRepo
            .find({})
            .sort({ createdAt: -1 })
            .populate('user_id')
            .lean();

        res.render('admin/dashboard/order-list', {
            title: "Tất cả đơn hàng",
            orders
        });
    } catch (err) {
        res.status(500).send("Lỗi server khi load đơn hàng");
    }
});


router.get('/export', async (req, res, next) => {
    try {
        await exportBillsToExcel(req, res, next);  // Gọi phương thức xuất Excel
    } catch (error) {
        next(error);
    }

});

router.get("/:billId", asyncHandler(BillController.renderInvoicePage));
router.get('/:id/invoice/download', BillController.downloadInvoice);




module.exports = router;
