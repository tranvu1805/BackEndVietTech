let currentTab = 'all';
let notifications = [];

// Hàm định dạng thời gian nhận vào từ API
function formatTime(timestamp) {
  if (!timestamp) return "Vừa xong";

  const now = new Date();
  const notificationTime = new Date(timestamp);
  const diffMs = now - notificationTime;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Vừa xong";
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 30) return `${diffDays} ngày trước`;

  // Định dạng ngày tháng đầy đủ nếu quá lâu
  return notificationTime.toLocaleDateString('vi-VN');
}

// Hàm xác định icon và type cho thông báo dựa trên nội dung
function getNotificationStyle(notification) {
  const title = notification.title?.toLowerCase() || '';
  const message = notification.message?.toLowerCase() || '';
  const content = title + ' ' + message;

  if (content.includes('đơn hàng') || content.includes('thanh toán')) {
    return { icon: 'fa-shopping-cart', type: 'primary' };
  } else if (content.includes('hết hàng') || content.includes('cảnh báo') || content.includes('lỗi')) {
    return { icon: 'fa-exclamation-triangle', type: 'warning' };
  } else if (content.includes('thành công') || content.includes('hoàn thành')) {
    return { icon: 'fa-check-circle', type: 'success' };
  } else if (content.includes('cập nhật') || content.includes('hệ thống')) {
    return { icon: 'fa-sync-alt', type: 'info' };
  } else {
    return { icon: 'fa-bell', type: 'primary' };
  }
}

// Hàm render thông báo với UI cải tiến
function renderNotifications(filter = 'all') {
  const notificationList = document.getElementById('notificationList');
  if (!notificationList) return;

  // Lọc thông báo nếu cần
  let filteredNotifications = notifications;
  if (filter === 'unread') {
    filteredNotifications = notifications.filter(notification => !notification.isRead);
  }

  // Cập nhật tab hiện tại
  currentTab = filter;

  // Xóa nội dung cũ
  notificationList.innerHTML = '';

  // Hiển thị thông báo mới
  if (filteredNotifications.length === 0) {
    notificationList.innerHTML = `
            <li class="list-group-item text-center py-4">
                <div class="empty-state">
                    <i class="fas fa-bell-slash text-muted mb-3" style="font-size: 2rem;"></i>
                    <p class="text-muted">Không có thông báo ${filter === 'unread' ? 'chưa đọc' : ''}</p>
                </div>
            </li>
        `;
    return;
  }

  filteredNotifications.forEach(notification => {
    // Xác định icon và loại thông báo
    const { icon, type } = getNotificationStyle(notification);

    // Tạo item thông báo
    const notificationItem = document.createElement('li');
    notificationItem.className = `list-group-item ${!notification.isRead ? 'unread' : ''}`;
    notificationItem.style.cursor = 'pointer';

    notificationItem.innerHTML = `
            <div class="notification-item">
                <div class="notification-icon ${type}">
                    <i class="fas ${icon}"></i>
                </div>
                <div class="notification-content">
                    <div class="notification-title">${notification.title || 'Thông báo'}</div>
                    <div class="notification-message">${notification.message || ''}</div>
                    <div class="notification-time">
                        <i class="far fa-clock"></i> ${formatTime(notification.createdAt)}
                    </div>
                </div>
            </div>
        `;

    // Thêm sự kiện click
    notificationItem.addEventListener('click', () => {
      if (!notification.isRead) markAsRead(notification._id);
      if (notification.url) window.location.href = notification.url;
    });

    notificationList.appendChild(notificationItem);
  });
}

// Hàm cập nhật badge thông báo
function updateNotificationBadge() {
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const badge = document.getElementById('notificationBadge');

  if (badge) {
    badge.textContent = unreadCount;
    badge.style.display = unreadCount > 0 ? 'flex' : 'none';
  }
}

// Hàm lấy thông báo từ API - giữ nguyên chức năng gọi API
async function fetchNotifications() {
  const accessToken = localStorage.getItem('accessToken');
  const userIds = localStorage.getItem('userId');
  const apiKey = 'c244dcd1532c91ab98a1c028e4f24f81457cdb2ac83e2ca422d36046fec84233589a4b51eda05e24d8871f73653708e3b13cf6dd1415a6330eaf6707217ef683';

  try {
    const response = await fetch('/v1/api/notification', {
      headers: {
        'Content-Type': 'application/json',
        authorization: accessToken,
        'x-client-id': userIds,
        'x-api-key': apiKey
      },
      credentials: 'include' // nếu dùng cookie để xác thực
    });

    const data = await response.json();
    notifications = data.notifications || [];

    // Cập nhật UI
    updateNotificationBadge();
    renderNotifications(currentTab);

  } catch (error) {
    console.error("Lỗi khi load thông báo:", error);
    notifications = [];
  }
}

// Gọi API đánh dấu đã đọc - giữ nguyên chức năng gọi API
async function markAsRead(notificationId) {
  const accessToken = localStorage.getItem('accessToken');
  const userIds = localStorage.getItem('userId');
  const apiKey = 'c244dcd1532c91ab98a1c028e4f24f81457cdb2ac83e2ca422d36046fec84233589a4b51eda05e24d8871f73653708e3b13cf6dd1415a6330eaf6707217ef683';

  try {
    await fetch(`/v1/api/notification/${notificationId}/read`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        authorization: accessToken,
        'x-client-id': userIds,
        'x-api-key': apiKey
      },
      credentials: 'include'
    });

    // Cập nhật local state
    notifications = notifications.map(noti => {
      if (noti._id === notificationId) {
        return { ...noti, isRead: true };
      }
      return noti;
    });

    // Cập nhật UI
    updateNotificationBadge();
    renderNotifications(currentTab);

  } catch (err) {
    console.error('Không thể đánh dấu đã đọc', err);
  }
}

// Hàm đánh dấu tất cả thông báo là đã đọc
async function markAllAsRead() {
  const accessToken = localStorage.getItem('accessToken');
  const userIds = localStorage.getItem('userId');
  const apiKey = 'c244dcd1532c91ab98a1c028e4f24f81457cdb2ac83e2ca422d36046fec84233589a4b51eda05e24d8871f73653708e3b13cf6dd1415a6330eaf6707217ef683';

  try {
    await fetch(`/v1/api/notification/read-all`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        authorization: accessToken,
        'x-client-id': userIds,
        'x-api-key': apiKey
      },
      credentials: 'include'
    });

    // Cập nhật trạng thái cục bộ
    notifications = notifications.map(noti => ({ ...noti, isRead: true }));

    // Cập nhật UI
    updateNotificationBadge();
    renderNotifications(currentTab);

  } catch (err) {
    console.error('Không thể đánh dấu tất cả đã đọc', err);
  }
}


document.addEventListener('DOMContentLoaded', function () {
  // Get register form if it exists on the page
  const registerForm = document.querySelector('form[action="/register"]');

  const name = JSON.parse(localStorage.getItem("account")) || "Người dùng";
  console.log("Name:", name);
  const avatar = localStorage.getItem("avatar") || "https://via.placeholder.com/40?text=U";



  const nameEl = document.getElementById("user-fullname");
  const avatarEl = document.getElementById("user-avatar");

  if (nameEl) nameEl.textContent = name.full_name;
  if (avatarEl) avatarEl.src = name.avatar

  if (registerForm) {
    registerForm.addEventListener('submit', function (event) {
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirm_password').value;

      // Check if passwords match
      if (password !== confirmPassword) {
        event.preventDefault();
        alert('Mật khẩu không khớp. Vui lòng thử lại!');
      }

      // Password strength validation
      if (password.length < 6) {
        event.preventDefault();
        alert('Mật khẩu phải có ít nhất 6 ký tự');
      }
    });
  }

  // Initialize tooltips and popovers
  var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });

  var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
  var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
    return new bootstrap.Popover(popoverTriggerEl);
  });

  // Add active class to current navbar item
  const currentLocation = location.pathname;
  const navLinks = document.querySelectorAll('.navbar-nav .nav-link');

  navLinks.forEach(link => {
    if (link.getAttribute('href') === currentLocation) {
      link.classList.add('active');
    }
  });

  fetchNotifications();





  // const nameEl = document.getElementById("user-fullname");
  //

  // if (nameEl) nameEl.textContent = name;
  // if (avatarEl) avatarEl.src = avatar;

  // Lấy các phần tử DOM
  const notificationToggle = document.getElementById('notificationToggle');
  const notificationBox = document.getElementById('notificationBox');
  const tabButtons = document.querySelectorAll('.tab-btn');
  const markAllReadBtn = document.querySelector('.mark-all-read');

  // Xử lý sự kiện hiển thị/ẩn popup thông báo
  if (notificationToggle && notificationBox) {
    notificationToggle.addEventListener('click', function (e) {
      e.stopPropagation();

      if (notificationBox.classList.contains('show')) {
        notificationBox.classList.remove('show');
        setTimeout(() => {
          notificationBox.style.display = 'none';
        }, 300);
      } else {
        notificationBox.style.display = 'block';
        setTimeout(() => {
          notificationBox.classList.add('show');
        }, 10);
      }
    });
  }

  // Xử lý sự kiện chuyển tab
  if (tabButtons) {
    tabButtons.forEach(button => {
      button.addEventListener('click', function () {
        tabButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');

        const tabType = this.getAttribute('data-tab');
        renderNotifications(tabType);
      });
    });
  }

  // Xử lý sự kiện đánh dấu tất cả đã đọc
  if (markAllReadBtn) {
    markAllReadBtn.addEventListener('click', function () {
      markAllAsRead();
    });
  }

  // Đóng popup khi click bên ngoài
  document.addEventListener('click', function (e) {
    if (notificationBox && !notificationBox.contains(e.target) && e.target !== notificationToggle) {
      notificationBox.classList.remove('show');
      setTimeout(() => {
        notificationBox.style.display = 'none';
      }, 300);
    }
  });


});

// Show password toggle function
function togglePasswordVisibility(inputId) {
  const passwordInput = document.getElementById(inputId);
  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
  } else {
    passwordInput.type = 'password';
  }
}

async function logout() {
  try {
    const refreshToken = localStorage.getItem("refreshToken"); // Lấy refreshToken từ localStorage
    console.log("refreshToken", refreshToken);


    const response = await fetch("/v1/api/access/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log("✅ Logout thành công:", data.message);

      // Xóa token khỏi trình duyệt
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      sessionStorage.clear(); // Xóa tất cả session nếu cần

      // Chuyển hướng về trang đăng nhập
      window.location.href = "/";
    } else {
      console.error("❌ Lỗi khi logout:", data.message);
    }
  } catch (error) {
    console.error("❌ Lỗi logout trên client:", error);
  }
}
