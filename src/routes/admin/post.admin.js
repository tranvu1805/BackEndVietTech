const express = require('express');
const postController = require('../../controllers/post.controller');
const { post } = require('../../models/post.model');
const router = express.Router();

router.get("/list", postController.getPostListPage);
router.get("/create", postController.getCreatePostPage);
router.get("/edit/:id", postController.getEditPostPage);
router.put("/:id/toggle-status", postController.togglePostStatus);
router.get('/preview/:id', async (req, res) => {
    const postId = req.params.id;

    try {
        const foundPost = await post.findById(postId).lean();
        if (!foundPost) return res.status(404).send("Không tìm thấy bài viết");

        // Trả về đoạn HTML để gắn vào modal
        const html = `
            <h5>${foundPost.title}</h5>
            <div style="white-space: pre-wrap;">${foundPost.content}</div>
        `;
        res.send(html);

    } catch (err) {
        console.error(err);
        res.status(500).send("Lỗi server");
    }
});


module.exports = router;
