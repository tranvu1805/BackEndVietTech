"use strict";

const express = require("express");
const accessController = require("../../controllers/accessController");
const { asyncHandler } = require("../../auth/checkAuth");
const router = express.Router();
//sign up
router.post("/shop/signUp", asyncHandler(accessController.signUp));

module.exports = router;
