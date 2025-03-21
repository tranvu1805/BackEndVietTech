const express = require("express");
const { getAllCategories_Admin } = require("../../controllers/category.controller");
const { getAllProducts_Admin, getProductById_Admin, exportProductsToExcel } = require("../../controllers/product.controller");
const router = express.Router();
router.get("/list", async (req, res) => {
    try {
        const products = await getAllProducts_Admin(req, res);
        res.render("admin/product-list", { products });
    } catch (error) {
        console.error("Error loading products:", error);
        res.status(500).send("Error loading products!");
    }
});

router.get("/create", async (req, res) => {
    try {
        // Lấy tất cả danh mục từ cơ sở dữ liệu
        const categories = await getAllCategories_Admin();

        // Render view với categories và một sản phẩm rỗng (dùng cho tạo mới)
        res.render("admin/product-form", { action: "Create", product: {}, categories });
    } catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).send("Error loading categories!");
    }
});

router.get("/edit/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const product = await getProductById_Admin(req, res);  // Lấy sản phẩm theo id
        const categories = await getAllCategories_Admin();  // Lấy danh mục
        if (!product) {
            return res.status(404).send("Product not found");
        }
        console.log("check product: ", product);
        
        res.render("admin/product-form", { action: "Edit", product, categories });
    } catch (error) {
        console.error("Error loading product:", error);
        res.status(500).send("Error loading product!");
    }
});

router.get('/export', async (req, res, next) => {
    try {
        await exportProductsToExcel(req, res, next);  // Gọi phương thức xuất Excel
    } catch (error) {
        next(error);
    }
});


module.exports = router;