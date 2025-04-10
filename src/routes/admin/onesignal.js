const express = require('express');
const router = express.Router();
const AccountModel = require('../../models/account.model');

// POST: /v1/api/admin/onesignal/save-player-id
router.post('/save-player-id', async (req, res) => {
    try {
        const { oneSignalId } = req.body;

        console.log("OneSignal ID:", oneSignalId);

        if (!oneSignalId) {
            return res.status(400).json({ message: 'Thiếu OneSignal ID' });
        }
        
        // 👉 Sửa lại dòng này: nếu bạn dùng session thì là req.session.accountId
        const accountId = req.session?.accountId || req.user?.userId;
        console.log("Account ID 2:", req.user);
        if (!accountId) {
            return res.status(401).json({ message: 'Bạn chưa đăng nhập' });
        }

        await AccountModel.findByIdAndUpdate(accountId, {
            oneSignalId,
        });

        return res.json({ success: true, message: 'Lưu OneSignal ID thành công' });
    } catch (error) {
        console.error("Lỗi lưu OneSignal ID:", error);
        return res.status(500).json({ message: 'Lỗi server' });
    }
});

module.exports = router;
