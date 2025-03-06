const express = require("express");
const router = express.Router();

router.use("/categories", require("./category.route"));
router.use("/products", require("./product.route"));

module.exports = router;
