const express = require("express");
const router = express.Router();
const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getAllProducts_Admin,
  getProductsByCategory,
  getTopSellingProducts,
  matchVariant,
} = require("../../controllers/product.controller");
const { authentication } = require("../../auth/authUtils");
const upload = require("../../auth/middlewares/upload.middleware");
const asyncHandler = require("../../helpers/asyncHandler");



router.get("/", getAllProducts);
router.get("/top-selling", asyncHandler(getTopSellingProducts));
router.get("/category/:categoryId", getProductsByCategory);
router.get("/:id", getProductById);
router.post("/:productId/match-variant", asyncHandler(matchVariant));
router.use(authentication)


router.post("/", upload.single('product_thumbnail'), createProduct);

router.put("/:id", upload.single('product_thumbnail'), updateProduct);
router.delete("/:id", deleteProduct);

module.exports = router;
