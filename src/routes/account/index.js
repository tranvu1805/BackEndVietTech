const express = require("express");
const router = express.Router();
const AccountController = require("../../controllers/account.controller");

router.post("/signup", AccountController.signUp);
router.post("/login", AccountController.login);

module.exports = router;
