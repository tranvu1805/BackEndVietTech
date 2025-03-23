const express = require("express");
const {
  getAllBills_Admin,
  exportBillsToExcel,
} = require("../../controllers/bill.controller");
const router = express.Router();
router.get("/", async (req, res) => {
  try {
    const bills = await getAllBills_Admin(req, res);
    res.render("admin/bill-list", { bills });
  } catch (error) {
    console.error("Error loading bills:", error);
    res.status(500).send("Error loading bills!");
  }
});

router.get("/export", async (req, res, next) => {
  try {
    await exportBillsToExcel(req, res, next); // Gọi phương thức xuất Excel
  } catch (error) {
    next(error);
  }
});

module.exports = router;
