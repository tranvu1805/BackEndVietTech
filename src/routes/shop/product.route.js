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

router.get("/", getAllProducts);
router.get("/:id", getProductById);


router.use(authentication)

router.post("/", createProduct);

router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);

module.exports = router;
