const express = require("express");
const router = express.Router();
const upload = require("../../auth/middlewares/upload.middleware");

const {
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
  getCategoryById,
  getAttributesByCategory,
} = require("../../controllers/category.controller");
// const { route } = require("./category.route");

//fix library import
const { authentication } = require("../../auth/authUtils");

router.get("/:id/attributes", getAttributesByCategory);

router.get("/:id", getCategoryById);
router.get("/", getAllCategories);

router.use(authentication)

router.post("/", upload.single("thumbnail_file"), createCategory);
router.put("/:id", upload.single("thumbnail_file"), updateCategory);

router.delete("/:id", deleteCategory);

module.exports = router;
