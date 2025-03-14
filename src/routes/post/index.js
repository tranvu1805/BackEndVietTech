"use strict";

const express = require("express");
const postController = require("../../controllers/post.controller");
const router = express.Router();
const { asyncHandler } = require("../../auth/checkAuth");
router.post("", asyncHandler(postController.createPost));
router.delete("", asyncHandler(postController.deletePost));
router.put("", asyncHandler(postController.updatePost));
router.get("", asyncHandler(postController.getAllPost));

module.exports = router;
