const express = require("express");
const accessController = require("../../controllers/access.controller");
const { apiKey } = require("../../auth/checkAuth");
const { authSession, authentication } = require("../../auth/middlewares/authMiddleware");

const router = express.Router();


// router.get('/login', (req, res) => {
//    res.render('home/login');
// });

router.use(authentication)


router.use("/products", require("./product.admin"));
router.use("/categories", require("./category.admin"));
router.use("/bills", require("./bill.admin"));
router.use("/user", require("./user.admin"));


router.get('/dashboard', (req, res) => {
    res.render('admin/dashboard')
})

module.exports = router;