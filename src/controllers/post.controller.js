"use strict";

const PostService = require("../services/post.service");
const { SuccessResponse } = require("../core/success.response");
const { ErrorResponse } = require("../core/error.response");
const { StatusCodes } = require("../utils/httpStatusCode");

class PostController {
  createPost = async (req, res, next) => {
    new SuccessResponse({
      message: "Post created successfully",
      metadata: await PostService.createPost(req.body),
    }).send(res);
  };

  updatePost = async (req, res, next) => {
    const updateData = {
      ...req.body,
      postId: req.params.id,
    };
    if (!updateData.postId) {
      return new ErrorResponse(
        "Post ID is required",
        StatusCodes.BAD_REQUEST
      ).send(res);
    }

    const result = await PostService.updatePost(updateData);

    new SuccessResponse({
      message: "Post updated successfully",
      metadata: result,
    }).send(res);
  };
  deletePost = async (req, res, next) => {
    const postId = req.params.id;
    if (!postId) {
      return new ErrorResponse(
        "Post ID is required",
        StatusCodes.BAD_REQUEST
      ).send(res);
    }
    const result = await PostService.deletePost({
      postId,
    });

    new SuccessResponse({
      message: "Post deleted successfully",
      metadata: result,
    }).send(res);
  };

  getAllPost = async (req, res, next) => {
    new SuccessResponse({
      message: "Post list successfully",
      metadata: await PostService.getAllPosts(req.query),
    }).send(res);
  };
  getPostById = async (req, res, next) => {
    if (!req.params.id)
      return ErrorResponse("Id is required", StatusCodes.BAD_REQUEST);
    new SuccessResponse({
      message: "get post successfully",
      metadata: await PostService.getPostById({ postId: req.params.id }),
    }).send(res);
  };
}

module.exports = new PostController();
