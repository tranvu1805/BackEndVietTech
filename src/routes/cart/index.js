"use strict";

const express = require("express");
const cartController = require("../../controllers/cart.controller");
const router = express.Router();
const { asyncHandler } = require("../../auth/checkAuth");
const { authentication } = require("../../auth/authUtils");

router.use(authentication);
router.post("", asyncHandler(cartController.addToCart));
router.delete("", asyncHandler(cartController.delete));
router.put("", asyncHandler(cartController.update));
router.get("", asyncHandler(cartController.listToCart));

router.post("/checkout", asyncHandler(cartController.checkout));

module.exports = router;
