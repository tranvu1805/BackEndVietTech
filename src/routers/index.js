"use strict";

const express = require("express");
const { apiKey, permission } = require("../auth/checkAuth");
const router = express.Router();

router.use(apiKey);
router.use(permission("0000"));
router.use("/v1/api", require("./access"));
// router.get("", (req, res, next) => {
//   return res.status(200).json({
//     message: "Welcome to the shop",
//   });
// });

module.exports = router;
