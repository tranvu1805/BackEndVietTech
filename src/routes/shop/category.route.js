const express = require("express");
const router = express.Router();
const { createCategory, getAllCategories } = require("../../controllers/category.controller");

router.post("/", createCategory);
router.get("/", getAllCategories);

module.exports = router;
