window.OneSignalDeferred = window.OneSignalDeferred || [];

OneSignalDeferred.push(async (OneSignal) => {
    try {
        // Khởi tạo OneSignal
        await OneSignal.init({
            appId: "29ae4e65-bafd-49fb-8c3b-cde54d2bf2bb",
            notifyButton: { enable: true }, // Hiển thị nút thông báo
            serviceWorkerPath: "/OneSignalSDKWorker.js", // Đường dẫn đến service worker
        });

        console.log("✅ Đã khởi tạo OneSignal");

        // Chờ 1 giây để đảm bảo OneSignal sẵn sàng
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Kiểm tra tính khả dụng
        if (!OneSignal.User) {
            console.warn("⚠️ OneSignal.User không khả dụng", OneSignal);
            return;
        }

        console.log("Các thuộc tính có sẵn của OneSignal.User:", Object.keys(OneSignal.User));

        if (!OneSignal.User.PushSubscription) {
            console.warn("⚠️ OneSignal.User.PushSubscription không khả dụng");
            console.log("Các thuộc tính có sẵn của OneSignal.User:", Object.keys(OneSignal.User));
            return;
        }

        const subscription = OneSignal.User.PushSubscription;

        // Ghi log các thuộc tính của subscription để kiểm tra
        console.log("Các thuộc tính của subscription:", Object.keys(subscription));

        // Kiểm tra trạng thái đăng ký bằng thuộc tính optedIn
        const daDangKy = subscription.optedIn;
        console.log("📦 Đã đăng ký:", daDangKy);

        if (daDangKy) {
            await xuLyDangKy(OneSignal);
        }

        // Lắng nghe sự thay đổi đăng ký
        subscription.addEventListener("change", async (event) => {
            console.log("🔔 Trạng thái đăng ký thay đổi:", event.current.optedIn);
            if (event.current.optedIn) {
                await xuLyDangKy(OneSignal);
            }
        });

    } catch (error) {
        console.error("❌ Lỗi trong luồng OneSignal:", error);
    }
});

/**
 * Xử lý khi người dùng đăng ký thông báo
 * @param {Object} OneSignal - Instance của OneSignal
 */
async function xuLyDangKy(OneSignal) {
    try {
        const oneSignalId = OneSignal.User._currentUser?.onesignalId;
        if (!oneSignalId) {
            console.warn("⚠️ Không tìm thấy OneSignal ID");
            return;
        }

        const userId = localStorage.getItem("userId");
        const role = localStorage.getItem("role") || "user";

        console.log("🎯 OneSignal ID:", oneSignalId);
        console.log("🔖 Gán tags:", { externalUserId: userId, role });

        await OneSignal.User.addTags({
            externalUserId: userId,
            role: role.toLowerCase() === "admin" ? "admin" : "user",
        });
        console.log("Đã gán tags cho OneSignal ID:", OneSignal.User);
        const tags = await OneSignal.User.getTags();
        console.log("🔖 Tags hiện tại:", tags);

        await guiIdDenServer(oneSignalId);
    } catch (error) {
        console.error("❌ Lỗi khi xử lý đăng ký:", error);
    }
}


/**
 * Gửi ID người dùng đến server
 * @param {string} userId - ID OneSignal của người dùng
 */
async function guiIdDenServer(userId) {
    const accessToken = localStorage.getItem('accessToken');
    const userIds = localStorage.getItem('userId');
    const apiKey = 'c244dcd1532c91ab98a1c028e4f24f81457cdb2ac83e2ca422d36046fec84233589a4b51eda05e24d8871f73653708e3b13cf6dd1415a6330eaf6707217ef683'
    try {
        const response = await fetch('/v1/api/admin/onesignal/save-player-id', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                authorization: accessToken,
                'x-client-id': userIds,
                'x-api-key': apiKey
            },
            body: JSON.stringify({ oneSignalId: userId }),
        });

        if (!response.ok) {
            throw new Error(`Lỗi HTTP! trạng thái: ${response.status}`);
        }

        const data = await response.json();
        console.log("✅ Đã gửi đến server:", data);
    } catch (error) {
        console.error("❌ Gửi ID thất bại:", error);
    }
}