window.OneSignalDeferred = window.OneSignalDeferred || [];
OneSignalDeferred.push(function (OneSignal) {
  OneSignal.init({
    appId: "29ae4e65-bafd-49fb-8c3b-cde54d2bf2bb", // 👉 thay bằng app id của bạn
    notifyButton: {
      enable: true, // Cho hiện nút đăng ký ở góc phải
    },
    serviceWorkerPath: "/OneSignalSDKWorker.js", // ⚠️ Quan trọng, cần đúng URL
  });
});