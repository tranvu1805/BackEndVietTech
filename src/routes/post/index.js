"use strict";

const express = require("express");
const postController = require("../../controllers/post.controller");
const router = express.Router();
const { asyncHandler } = require("../../auth/checkAuth");
const { authentication } = require("../../auth/authUtils");
const upload = require("../../auth/middlewares/upload.middleware");


router.use(authentication);
router.post(
    "",
    upload.fields([
        { name: "thumbnail", maxCount: 1 },
        { name: "gallery_uploads", maxCount: 10 }
    ]),
    asyncHandler(postController.createPost)
);

router.put(
    "/:id",
    upload.fields([
        { name: "thumbnail", maxCount: 1 },
        { name: "gallery_uploads", maxCount: 10 },
    ]),
    asyncHandler(postController.updatePost)
);

router.delete("/:id", asyncHandler(postController.deletePost));
// router.put("/:id", asyncHandler(postController.updatePost));
router.get("", asyncHandler(postController.getAllPost));
router.get("/:id", asyncHandler(postController.getPostById));

module.exports = router;
