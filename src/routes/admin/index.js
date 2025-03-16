const express = require("express");
const accessController = require("../../controllers/access.controller");
const { apiKey } = require("../../auth/checkAuth");
const { getAllProducts_Admin, getProductById, getProductById_Admin } = require("../../controllers/product.controller");
const { getAllCategories, getAllCategories_Admin } = require("../../controllers/category.controller");
const { getAllBills, getAllBills_Admin, exportBillsToExcel } = require("../../controllers/bill.controller");
const { authSession, authentication } = require("../../auth/middlewares/authMiddleware");

const router = express.Router();


// router.get('/login', (req, res) => {
//    res.render('home/login');
// });

router.use(authentication)


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
        res.render("admin/product-form", { action: "Edit", product, categories });
    } catch (error) {
        console.error("Error loading product:", error);
        res.status(500).send("Error loading product!");
    }
});


router.get("/categories", async (req, res) => {
    try {
        const categories = await getAllCategories_Admin(req, res);
        res.render("admin/categories-list", { categories });
    } catch (error) {
        console.error("Error loading categories:", error);
        res.status(500).send("Error loading categories!");
    }
});

router.get("/bill", async (req, res) => {
    try {
        const bills = await getAllBills_Admin(req, res);
        res.render("admin/bill-list", { bills });
    } catch (error) {
        console.error("Error loading bills:", error);
        res.status(500).send("Error loading bills!");
    }
});

router.get('/bills/export', async (req, res, next) => {
    try {
        await exportBillsToExcel(req, res, next);  // Gọi phương thức xuất Excel
    } catch (error) {
        next(error);
    }
});



router.get('/dashboard', (req, res) => {
    res.render('admin/dashboard')
})

module.exports = router;