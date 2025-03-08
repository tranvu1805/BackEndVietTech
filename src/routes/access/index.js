const express = require('express')
const accessController = require('../../controllers/access.controller')
const { apiKey } = require('../../auth/checkAuth')
const router = express.Router()
//sign up
router.post('/staff/signup', apiKey, accessController.signUpEmployee)
router.post('/custumor/signup', apiKey, accessController.signUp)
router.post("/login", accessController.login);
router.post("/logout", accessController.logout);

module.exports = router