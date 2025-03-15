const express = require("express");
const accessController = require("../../controllers/access.controller");
const { apiKey } = require("../../auth/checkAuth");
const { getAllProducts_Admin } = require("../../controllers/product.controller");
const { getAllCategories } = require("../../controllers/category.controller");
const { getAllBills } = require("../../controllers/bill.controller");
const router = express.Router();


// router.get('/login', (req, res) => {
//    res.render('home/login');
// });

router.get("/list", async (req, res) => {
    try {
        const products = await getAllProducts_Admin(req, res);
        res.render("admin/product-list", { products });
    } catch (error) {
        console.error("Error loading products:", error);
        res.status(500).send("Error loading products!");
    }
});

router.get("/create", (req, res) => {
    res.render("admin/product-form", { action: "Create", product: {} });
});

router.get("/categories", async (req, res) => {
    try {
        const categories = await getAllCategories(req, res);
        res.render("admin/categories-list", { categories });
    } catch (error) {
        console.error("Error loading categories:", error);
        res.status(500).send("Error loading categories!");
    }
});

router.get("/bill", async (req, res) => {   
    try {
        const bills = await getAllBills(req, res);
        res.render("admin/bill-list", { bills });
    }catch (error) {
        console.error("Error loading bills:", error);
        res.status(500).send("Error loading bills!");
    }
});


router.get('/dashboard', (req, res) => {
    res.render('admin/dashboard')
})

module.exports = router;