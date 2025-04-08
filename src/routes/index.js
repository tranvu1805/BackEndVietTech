const express = require("express");
const router = express.Router();
// Import tất cả route con
const accountRoutes = require("./account/index");
const accessRoutes = require("./access/index");

const ShopRoutes = require("./shop/index");
const reviweRoutes = require("./review/index");
const reviweReportRoutes = require("./review_report/index");
const BillRoutes = require("./bill/index");
const ImageRoutes = require("./image/index");
const DisscountRoutes = require("./disscount/index");
const adminRoutes = require("./admin/index");
const logRoutes = require("./logs/index");
const vnpayRoutes = require("./vnpay/index"); // Import route VNPay

const accessController = require("../controllers/access.controller");
const { asyncHandler } = require("../auth/checkAuth");
const BillController = require("../controllers/bill.controller");


// API versioning
router.use("/v1/api/access", accessRoutes);
router.use("/v1/api/account", accountRoutes);
router.use("/v1/api/review", reviweRoutes);
router.use("/v1/api/review_report", reviweReportRoutes);
router.use("/v1/api/shop", ShopRoutes);
router.use("/v1/api/bill", BillRoutes);
router.use("/v1/api/cart", require("./cart"));
router.use("/v1/api/post", require("./post"));
router.use("/v1/api/disscount", DisscountRoutes);
router.use("/v1/api/admin", adminRoutes);
router.use("/v1/api/image", ImageRoutes);
router.use("/v1/api/log",logRoutes);

router.use("/v1/api/vnpay", vnpayRoutes); // Định tuyến VNPay API


// Route mặc định (Home Page)
router.get("/", (req, res) => {
  res.render("home/login");
});

router.post("/login", accessController.loginAdmin);
router.get("/user/bills/:billId", asyncHandler(BillController.renderInvoicePage));

router.use("/v1/api/cart", require("./cart"));

// Middleware xử lý lỗi 404 nếu không tìm thấy route nào phù hợp
router.use((req, res) => {
  res.status(404).json({
    message: "API Not Found",
  });
});

module.exports = router;
