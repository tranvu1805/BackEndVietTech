const { authentication } = require("../../auth/authUtils");
const BillController = require("../../controllers/bill.controller");
const express = require("express");
const logController = require("../../controllers/log.controller");
const logModel = require("../../models/log.model");
const router = express.Router();

router.get('/all', async (req, res) => {
    try {
        const logs = await logModel.find()
            .populate('changed_by', 'full_name')
            .sort({ changed_at: -1 });

        res.status(200).json({ success: true, logs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
router.get('/recent', logController.getRecentLogs);
router.get("/:billId/logs", authentication, BillController.getBillLogs);

module.exports = router;
