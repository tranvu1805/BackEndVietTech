"use strict";

const express = require("express");
const postController = require("../../controllers/post.controller");
const router = express.Router();
const { asyncHandler } = require("../../auth/checkAuth");
router.post("", asyncHandler(postController.createPost));
router.delete("/:id", asyncHandler(postController.deletePost));
router.put("/:id", asyncHandler(postController.updatePost));
router.get("", asyncHandler(postController.getAllPost));
router.get("/:id", asyncHandler(postController.getPostById));

module.exports = router;
