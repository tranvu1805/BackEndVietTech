"use strict";

const {
  ErrorResponse,
  ConflictRequestError,
  NotFoundError,
} = require("../core/error.response");
const { post } = require("../models/post.model");
const { StatusCodes } = require("../utils/httpStatusCode");

class PostService {
  // Các repository methods
  static async createPostRepo({ title, content, account_id, status }) {
    return await post.create({ title, content, account_id, status });
  }

  static async updatePostRepo({ postId, title, content, status, account_id }) {
    const filter = { _id: postId };
    const updateData = {
      $set: {
        title,
        content,
        status,
        updatedBy: account_id,
        updatedAt: new Date(),
      },
    };

    const options = { new: true };

    const updatedPost = await post.findOneAndUpdate(
      filter,
      updateData,
      options
    );

    if (!updatedPost) {
      throw new NotFoundError("Post not found");
    }

    return updatedPost;
  }

  static async deletePostRepo({ postId }) {
    const foundPost = await post.findById(postId);
    if (!foundPost) {
      throw new NotFoundError("Post not found");
    }
    const deletedPost = await post.findByIdAndDelete(postId);
    if (!deletedPost) {
      throw new ConflictRequestError("Cannot delete post");
    }
    return deletedPost;
  }

  static async getAllPostRepo({ filter = {}, select = "" } = {}) {
    try {
      const posts = await post
        .find(filter)
        .select(select)
        .sort({ createdAt: -1 }) // Sắp xếp theo thời gian tạo, mới nhất trước
        .lean();

      return posts;
    } catch (error) {
      console.error("Error getting posts:", error);
      throw error;
    }
  }

  // Service methods sử dụng repositories
  static async createPost({ title, content, account_id, status }) {
    if (!title || !content) {
      throw new ErrorResponse(
        "Title and content are required",
        StatusCodes.BAD_REQUEST
      );
    }
    const newPost = await PostService.createPostRepo({
      title,
      content,
      account_id,
      status: status || "draft",
    });

    return newPost;
  }

  static async updatePost({ postId, title, content, status, account_id }) {
    try {
      if (!postId) {
        throw new ErrorRequest("Post ID is required", StatusCodes.BAD_REQUEST);
      }

      // Kiểm tra post có tồn tại không
      const existingPost = await post.findById(postId);
      if (!existingPost) {
        throw new NotFoundError("Post not found");
      }

      // Gọi repository để cập nhật bài viết
      const updatedPost = await PostService.updatePostRepo({
        postId,
        title,
        content,
        status,
        account_id,
      });

      return updatedPost;
    } catch (error) {
      console.error("Error updating post:", error);
      throw error;
    }
  }

  static async deletePost({ postId, account_id }) {
    try {
      if (!postId) {
        throw new BadRequestError("Post ID is required");
      }

      // Gọi repository để xóa bài viết
      const deletedPost = await PostService.deletePostRepo({ postId });

      return {
        deleted: true,
        data: deletedPost,
      };
    } catch (error) {
      console.error("Error deleting post:", error);
      throw error;
    }
  }

  static async getAllPosts({
    filter = {},
    select = "",
    sortBy = "createdAt",
  } = {}) {
    try {
      const posts = await PostService.getAllPostRepo({
        filter,
        select,
      });

      return {
        data: posts,
        count: posts.length,
      };
    } catch (error) {
      console.error("Error getting all posts:", error);
      throw error;
    }
  }
}

module.exports = PostService;
