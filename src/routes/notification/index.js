// routes/notification.route.js
const express = require('express');
const router = express.Router();
const notificationModel = require('../../models/notification.model');
const { authentication } = require('../../auth/authUtils');

router.use(authentication)

// Lấy danh sách thông báo của người dùng
router.get('/', async (req, res) => {
    console.log("Request user:", req.user); // Kiểm tra xem req.user có đúng không

    try {
        const userId = req.user._id;
        console.log("User ID:", userId); // Kiểm tra xem userId có đúng không

        const notifications = await notificationModel.find({ receiverId: userId })
            .sort({ createdAt: -1 })
            .limit(30);

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
