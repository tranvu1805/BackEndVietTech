const express = require("express");
const router = express.Router();
// Import tất cả route con
const accountRoutes = require("./account/index");
const accessRoutes = require("./access/index");
const ShopRoutes = require("./shop/index")

const BillRoutes = require("./bill/index")
const DisscountRoutes = require("./disscount/index")

// API versioning
router.use("/v1/api/access", accessRoutes);
router.use('/v1/api/account', accountRoutes)
router.use("/v1/api/shop", ShopRoutes);

router.use("/v1/api/bill", BillRoutes);
router.use("/v1/api/disscount", DisscountRoutes);

// Route mặc định (Home Page)
router.get("/", (req, res) => {
  res.status(200).json({
    message: "Welcome to account API!",
  });
});

router.use("/v1/api/cart", require("./cart"));
// Middleware xử lý lỗi 404 nếu không tìm thấy route nào phù hợp
router.use((req, res) => {
  res.status(404).json({
    message: "API Not Found",
  });
});

module.exports = router;
