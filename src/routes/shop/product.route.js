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
  getTopSellingList,
} = require("../../controllers/product.controller");
const { authentication } = require("../../auth/authUtils");
const upload = require("../../auth/middlewares/upload.middleware");
const asyncHandler = require("../../helpers/asyncHandler");



router.get("/", getAllProducts);
router.get("/top-selling-list", asyncHandler(getTopSellingList));
router.get("/top-selling", asyncHandler(getTopSellingProducts));
router.get("/category/:categoryId", getProductsByCategory);
router.get("/:id", getProductById);
router.post("/:productId/match-variant", asyncHandler(matchVariant));
router.use(authentication)


router.post(
  "/",
  upload.fields([
    { name: 'product_thumbnail', maxCount: 1 },
    { name: 'gallery_uploads[]', maxCount: 10 }
  ]),
  createProduct
);

router.put(
  "/:id",
  upload.fields([
    { name: 'product_thumbnail', maxCount: 1 },
    { name: 'gallery_uploads[]', maxCount: 10 }
  ]),
  updateProduct
);

router.delete("/:id", deleteProduct);

module.exports = router;
