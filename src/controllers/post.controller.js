"use strict";

const PostService = require("../services/post.service");
const { SuccessResponse } = require("../core/success.response");
const { ErrorResponse } = require("../core/error.response");

class PostController {
  createPost = async (req, res, next) => {
    new SuccessResponse({
      message: "Post created successfully",
      metadata: await PostService.createPost(req.body),
    }).send(res);
  };

  updatePost = async (req, res, next) => {
    new SuccessResponse({
      message: "Post updated successfully",
      metadata: await PostService.updatePost(req.body),
    }).send(res);
  };
  deletePost = async (req, res, next) => {
    new SuccessResponse({
      message: "Post deleted successfully",
      metadata: await PostService.deletePost(req.body),
    }).send(res);
  };

  getAllPost = async (req, res, next) => {
    if (!req.query) return ErrorResponse("userId is required");
    new SuccessResponse({
      message: "Post list successfully",
      metadata: await PostService.getAllPosts(req.query),
    }).send(res);
  };
}

module.exports = new PostController();
