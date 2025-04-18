// routes/notification.route.js
const express = require('express');
const router = express.Router();
const notificationModel = require('../../models/notification.model');
const { authentication: apiAuth } = require('../../auth/authUtils');
const { authentication: webbAuth } = require('../../auth/middlewares/authMiddleware')


router.get('/get-all', webbAuth, async (req, res) => {
    try {
        const userId = req.user.userId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const totalCount = await notificationModel.countDocuments({ receiverId: userId });
        const totalPages = Math.ceil(totalCount / limit);

        const notifications = await notificationModel.find({ receiverId: userId })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        res.render('notifications/list', {
            title: 'Tất cả thông báo',
            notifications,
            currentPage: page,
            totalPages
        });
    } catch (error) {
        console.error('Lỗi lấy thông báo:', error);
        res.status(500).send('Lỗi server');
    }
});



router.use(apiAuth)

// Lấy danh sách thông báo của người dùng
router.get('/', async (req, res) => {
    console.log("Request user:", req.user); // Kiểm tra xem req.user có đúng không

    try {
        const userId = req.user._id;
        console.log("User ID:", userId); // Kiểm tra xem userId có đúng không

        const notifications = await notificationModel.find({ receiverId: userId })
            .sort({ createdAt: -1 })
            .limit(30);

        console.log("Notifications:", userId); // Kiểm tra xem notifications có đúng không


        res.status(200).json({ notifications });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi khi lấy thông báo', error: err });
    }
});

// Đánh dấu đã đọc
router.put('/:id/read', async (req, res) => {
    try {
        await notificationModel.findByIdAndUpdate(req.params.id, { isRead: true });
        res.status(200).json({ message: 'Đã đánh dấu đã đọc' });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi khi cập nhật', error: err });
    }
});

router.put('/read-all', async (req, res) => {
    try {
        const userId = req.user._id;

        const result = await notificationModel.updateMany(
            { receiverId: userId, isRead: false }, // chỉ update nếu chưa đọc
            { $set: { isRead: true } }
        );

        res.status(200).json({
            message: 'Đã đánh dấu tất cả là đã đọc',
            modifiedCount: result.modifiedCount
        });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi khi cập nhật tất cả thông báo', error: err });
    }
});

module.exports = router;
