"use strict";

const express = require("express");
const accessController = require("../../controllers/accessController");
const router = express.Router();
//sign up
router.post("/shop/signUp", accessController.signUp);

module.exports = router;
