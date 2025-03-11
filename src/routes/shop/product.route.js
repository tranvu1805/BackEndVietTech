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
// router.get("/admin/list", async (req, res) => {
//   try {
//     const products = await getAllProducts_Admin(req, res);  // Chuyển `req` và `res` vào đây
//     res.render("admin/product-list", { products });
//   } catch (error) {
//     console.error("Error loading products:", error);
//     res.status(500).send("Error loading products!");
//   }
// });

// router.get("/create", (req, res) => {
//   res.render("admin/product-form", { action: "Create", product: {} });
// });


router.use(authentication)

router.post("/", createProduct);

router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);

module.exports = router;
