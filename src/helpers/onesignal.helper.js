require('dotenv').config();
const axios = require('axios');
const accountModel = require('../models/account.model');
const notificationModel = require('../models/notification.model');

const appId = process.env.ONESIGNAL_APP_ID;
const apiKey = process.env.ONESIGNAL_API_KEY;

if (!appId) {
    console.error('❌ Thiếu ONESIGNAL_APP_ID');
    throw new Error('Thiếu App ID trong cấu hình OneSignal');
}
if (!apiKey) {
    console.error('❌ Thiếu ONESIGNAL_API_KEY');
    throw new Error('Thiếu REST API Key trong cấu hình OneSignal');
}

console.log('ONESIGNAL_APP_ID:', appId);
console.log('ONESIGNAL_API_KEY:', apiKey);

/**
 * Gửi push notification đến admin, user hoặc cả hai
 * @param {Object} params
 * @param {string} params.titleUser - Tiêu đề cho user
 * @param {string} params.messageUser - Nội dung cho user
 * @param {string} params.titleAdmin - Tiêu đề cho admin
 * @param {string} params.messageAdmin - Nội dung cho admin
 * @param {string} [params.url] - URL khi người dùng click
 * @param {string} [params.userId] - ID người dùng (external_user_id đã gán trên client)
 * @param {string} [params.targets] - "admin", "user", "both" (mặc định là "admin")
 */
const sendPushNotification = async ({
    titleUser,
    messageUser,
    titleAdmin,
    messageAdmin,
    url,
    userId,
    targets = "user",
    data = {},
    type = "custom"
}) => {
    try {
        const app_id = process.env.ONESIGNAL_APP_ID;
        const apiKey = process.env.ONESIGNAL_API_KEY;
        console.log("target user", targets);
        let responseUser = null;
        let responseAdmin = null;

        const filters = [];

        // Nếu gửi cho user
        if (targets === "user" || targets === "both") {
            filters.push({ field: "tag", key: "externalUserId", relation: "=", value: userId });
        }

        // Nếu gửi cho admin
        if (targets === "admin" || targets === "both") {
            if (filters.length > 0) filters.push({ operator: "OR" });
            filters.push({ field: "tag", key: "externalUserId", relation: "=", value: "65e4a201d4a1d6b87e4e3f11" });
        }

        console.log("🔖 Filters:", filters);


        // Gửi push notification qua OneSignal
        // Gửi cho user
        if (targets === "user" || targets === "both") {
            responseUser = await axios.post(
                'https://onesignal.com/api/v1/notifications',
                {
                    app_id,
                    contents: { en: messageUser || "Bạn có thông báo mới" },
                    headings: { en: titleUser || "Thông báo" },
                    url: url || 'https://viettech.store',
                    filters: [
                        { field: "tag", key: "externalUserId", relation: "=", value: userId }
                    ],
                },
                {
                    headers: {
                        Authorization: `Basic ${apiKey}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
        }

        // Gửi cho admin
        if (targets === "admin" || targets === "both") {

            responseAdmin = await axios.post(
                'https://onesignal.com/api/v1/notifications',
                {
                    app_id,
                    contents: { en: messageAdmin || "Bạn có thông báo mới" },
                    headings: { en: titleAdmin || "Thông báo" },
                    url: url || 'https://viettech.store',
                    filters: [
                        { field: "tag", key: "role", relation: "=", value: "admin" }
                    ],
                },
                {
                    headers: {
                        Authorization: `Basic ${apiKey}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
        }


        // console.log("🔔 Gửi thông báo thành công:", response.data);

        // console.log("📤 Push sent! OneSignal ID:", response.data.id);

        // ✅ Lưu thông báo vào DB
        const notifications = [];

        if (targets === "user" || targets === "both") {
            console.log("🔖 Gửi thông báo cho user:", userId);
            notifications.push({
                receiverId: userId,
                title: titleUser || "thông báo",
                message: messageUser || "Bạn có thông báo mới",
                url,
                type,
                data,
            });
        }


        if (targets === "admin" || targets === "both") {
            console.log("🔖 Gửi thông báo cho admin");
            const adminAccounts = await accountModel.find().populate("role_id");
            const adminIds = adminAccounts
                .filter((acc) => acc.role_id?.name?.toLowerCase() === "admin")
                .map((acc) => acc._id.toString());

            adminIds.forEach((adminId) => {
                notifications.push({
                    receiverId: adminId,
                    title: titleAdmin || "thông báo",
                    message: messageAdmin || "Bạn có thông báo mới",
                    url,
                    type,
                    data,
                });
            });
        }

        if (notifications.length > 0) {
            await notificationModel.insertMany(notifications);
            console.log("💾 Đã lưu thông báo vào DB:", notifications.length);
            console.log("🔖 Notifications:", notifications);

        }

        return {
            userPush: responseUser?.data || null,
            adminPush: responseAdmin?.data || null,
            savedNotifications: notifications.length,
        };
    } catch (error) {
        console.error("❌ Push send failed:", error.response?.data || error.message);
        throw error;
    }
};
module.exports = { sendPushNotification };
