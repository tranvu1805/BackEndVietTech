const express = require("express");
const { getAllCategories_Admin } = require("../../controllers/category.controller");
const categoryModel = require("../../models/category.model");
const router = express.Router();
router.get("/", async (req, res) => {
  const result = await getAllCategories_Admin(req, res);
  if (!result.success) return;

  const {
    categories,
    currentPage,
    totalPages,
    limit,
    search,
    type,
    sortBy,       // 🆕 thêm vào
    sortOrder     // 🆕 thêm vào
  } = result;

  res.render("admin/categories-list", {
    categories,
    currentPage,
    totalPages,
    limit,
    search,
    type,
    sortBy,
    sortOrder
  });
});



router.get("/create", async (req, res) => {
  try {
    const categories = await categoryModel.find({}); // Giả sử bạn đang dùng Mongoose
    res.render("admin/category-form", { categories });
  } catch (error) {
    console.error("Lỗi khi lấy danh mục:", error);
    res.render("admin/category-form", { categories: [] }); // Tránh truyền undefined
  }
});


module.exports = router;