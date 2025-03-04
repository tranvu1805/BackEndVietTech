const express = require("express");
const router = express.Router();

// Import tất cả route con
const accountRoutes = require("./account/index");

// API versioning
router.use("/v1/api", accountRoutes);

// Route mặc định (Home Page)
router.get("/", (req, res) => {
  res.status(200).json({
    message: "Welcome to account API!",
  });
});

// Middleware xử lý lỗi 404 nếu không tìm thấy route nào phù hợp
router.use((req, res) => {
  res.status(404).json({
    message: "API Not Found",
  });
});

module.exports = router;
