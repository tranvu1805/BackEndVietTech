const { authentication } = require("../../auth/authUtils");
const BillController = require("../../controllers/bill.controller");
const express = require("express");
const router = express.Router();


// routes/bill.route.js hoặc admin.route.js
router.get("/:billId/logs", authentication, BillController.getBillLogs);

module.exports = router;
