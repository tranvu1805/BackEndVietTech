"use strict";

const PostService = require("../services/post.service");
const { SuccessResponse } = require("../core/success.response");
const { ErrorResponse } = require("../core/error.response");
const { StatusCodes } = require("../utils/httpStatusCode");
const accountModel = require("../models/account.model");
const { post } = require("../models/post.model");
const postModel = require("../models/post.model");


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

  getPostListPage = async (req, res) => {
    try {
      const { search, status, sort, page = 1, limit = 10 } = req.query;
      const filter = {};

      if (search) {
        filter.title = { $regex: search, $options: "i" };
      }
      if (status) {
        filter.status = status;
      }

      const sortOptions = {
        createdAt_desc: { createdAt: -1 },
        createdAt_asc: { createdAt: 1 },
        title_asc: { title: 1 },
        title_desc: { title: -1 },
      };
      const sortQuery = sortOptions[sort] || { createdAt: -1 };

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [posts, total] = await Promise.all([
        post.find(filter).sort(sortQuery).skip(skip).limit(limit).lean(),
        post.countDocuments(filter),
      ]);

      // Map author ID thành tên (nếu có)
      const authorIds = posts.map(p => p.account_id);
      const accounts = await accountModel.find({ _id: { $in: authorIds } }).lean();
      const authorsMap = {};
      accounts.forEach(acc => {
        authorsMap[acc._id.toString()] = acc.full_name || acc.username || acc.email || "Không rõ";
      });

      return res.render("admin/post-list", {
        posts,
        authors: authorsMap,
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        query: req.query
      });
    } catch (error) {
      console.error("Lỗi khi load trang quản lý bài viết:", error);
      return res.status(500).send("Lỗi server khi load trang quản lý bài viết.");
    }
  }

  getCreatePostPage = (req, res) => {
    try {
      res.render("admin/post-form"); // Tên file EJS bạn đang có
    } catch (error) {
      console.error("Lỗi hiển thị trang tạo bài viết:", error);
      res.status(500).send("Lỗi server");
    }
  }

  getEditPostPage = async (req, res) => {
    const postId = req.params.id;
    const postModel = await post.findById(postId);

    if (!postModel) return res.status(404).send("Không tìm thấy bài viết");

    res.render("admin/post-form", {
      isEdit: true,
      postModel
    });
  }

  togglePostStatus = async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['draft', 'publish'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ.' });
      }

      const posts = await post.findById(id);
      if (!posts) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết.' });
      }

      posts.status = status;
      await posts.save();

      return res.status(200).json({ success: true, message: `Đã chuyển trạng thái bài viết thành ${status === 'publish' ? 'Đã đăng' : 'Bản nháp'}.` });
    } catch (err) {
      console.error('togglePostStatus error:', err);
      return res.status(500).json({ success: false, message: 'Có lỗi xảy ra.' });
    }
  };
}

module.exports = new PostController();
