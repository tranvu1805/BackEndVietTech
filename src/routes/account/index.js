const express = require("express");
const router = express.Router();
const AccountController = require("../../controllers/account.controller");

router.post("/signup", AccountController.signUp);
router.post("/login", AccountController.login);
router.get("/account/:id", AccountController.getAccount);   
router.put("/update/:id", AccountController.updateAccount);
module.exports = router;
