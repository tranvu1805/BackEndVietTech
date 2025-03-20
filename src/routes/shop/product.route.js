const express = require("express");
const router = express.Router();
const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getAllProducts_Admin,
} = require("../../controllers/product.controller");
const { authentication } = require("../../auth/authUtils");
const upload = require("../../auth/middlewares/upload.middleware");

router.get("/", getAllProducts);
router.get("/:id", getProductById);


// router.use(authentication)

router.post("/", upload.single('product_thumbnail'), createProduct);

router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);

module.exports = router;
