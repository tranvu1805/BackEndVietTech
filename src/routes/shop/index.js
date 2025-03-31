const express = require("express");
const router = express.Router();

router.use("/categories", require("./category.route"));
router.use("/products", require("./product.route"));

router.use("/favorites", require("../favourite/index"));
router.use("/attributes", require("./attributes.route"));

module.exports = router;
