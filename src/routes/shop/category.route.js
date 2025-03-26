const express = require("express");
const router = express.Router();

const {
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
  getCategoryById,
  getAttributesByCategory,
} = require("../../controllers/category.controller");
// const { route } = require("./category.route");

const { authentication } = require("../../auth/authUtils");

router.get("/:id/attributes", getAttributesByCategory);

router.get("/:id", getCategoryById);
router.get("/", getAllCategories);

router.use(authentication)

router.post("/", createCategory);
router.put("/:id", updateCategory);
router.delete("/:id", deleteCategory);

module.exports = router;
