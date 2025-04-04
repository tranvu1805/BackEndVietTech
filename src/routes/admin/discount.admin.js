const express = require('express');
const DiscountController = require('../../controllers/disscount.controller');
const router = express.Router();


router.get('/list', DiscountController.getDiscountListPage);
router.get('/create', DiscountController.getCreateDiscountPage);

module.exports = router;
