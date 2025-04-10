// Các hàm hiện có giữ nguyên
async function deleteProduct(productId) {
    if (!productId) return;

    try {
        const response = await fetch(`/v1/api/shop/products/${productId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            alert("Xóa sản phẩm thành công!");
            location.reload(); // Reload trang để cập nhật danh sách sản phẩm
        } else {
            alert("Lỗi: Không thể xóa sản phẩm.");
        }
    } catch (error) {
        console.error("Lỗi khi xóa sản phẩm:", error);
        alert("Đã xảy ra lỗi khi xóa sản phẩm.");
    }
}

document.querySelectorAll('.nav-link').forEach(item => {
    item.addEventListener('click', function () {
        console.log("da o day");

        // Xóa lớp active khỏi tất cả các liên kết
        document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));

        // Thêm lớp active vào mục được chọn
        this.classList.add('active');
    });
});

document.getElementById('exportProductsButton').addEventListener('click', function () {
    fetch('/v1/api/admin/products/export', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => {
            if (response.ok) {
                return response.blob();
            }
            throw new Error('Error exporting products')
        })
        .then(blob => {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);  // Tạo URL cho file Blob
            link.download = 'all_products.xlsx';  // Đặt tên file khi tải về
            link.click();  // Tự động click vào link để tải file
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Có lỗi khi xuất file.');
        })
});

async function toggleStatus(productId, isDraft) {
    const confirmText = isDraft
        ? "Bạn muốn chuyển sản phẩm này sang trạng thái HIỂN THỊ?"
        : "Bạn muốn CHUYỂN SANG BẢN NHÁP sản phẩm này?";

    if (!confirm(confirmText)) return;

    try {
        const response = await fetch(`/v1/api/admin/products/${productId}/toggle-status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (data.success) {
            alert(data.message);
            location.reload();
        } else {
            alert("Lỗi: " + data.message);
        }
    } catch (error) {
        console.error("Lỗi khi thay đổi trạng thái:", error);
        alert("Đã xảy ra lỗi.");
    }
}

document.getElementById('applyFilter').addEventListener('click', function () {
    const name = document.getElementById('searchName').value;
    const status = document.getElementById('filterStatus').value;
    const stock = document.getElementById('filterStock').value;
    const sort = document.getElementById('sortOption').value;

    let query = '?';

    if (name) query += `search=${encodeURIComponent(name)}&`;
    if (status) query += `status=${status}&`;
    if (stock) query += `stock=${stock}&`;
    if (sort) query += `sort=${sort}&`;

    window.location.href = `/v1/api/admin/products/list${query}`;
});

document.getElementById('searchButton').addEventListener('click', function () {
    document.getElementById('applyFilter').click();
});

// ===== PHẦN MÃ THÔNG BÁO CẢI TIẾN =====

// Khởi tạo các biến toàn cục
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

// Thiết lập event listeners khi DOM đã tải
window.addEventListener('DOMContentLoaded', function() {
    // Gọi API lấy thông báo
    fetchNotifications();
    
    // Lấy các phần tử DOM
    const notificationToggle = document.getElementById('notificationToggle');
    const notificationBox = document.getElementById('notificationBox');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const markAllReadBtn = document.querySelector('.mark-all-read');
    
    // Xử lý sự kiện hiển thị/ẩn popup thông báo
    if (notificationToggle && notificationBox) {
        notificationToggle.addEventListener('click', function(e) {
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
            button.addEventListener('click', function() {
                tabButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                
                const tabType = this.getAttribute('data-tab');
                renderNotifications(tabType);
            });
        });
    }
    
    // Xử lý sự kiện đánh dấu tất cả đã đọc
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', function() {
            markAllAsRead();
        });
    }
    
    // Đóng popup khi click bên ngoài
    document.addEventListener('click', function(e) {
        if (notificationBox && !notificationBox.contains(e.target) && e.target !== notificationToggle) {
            notificationBox.classList.remove('show');
            setTimeout(() => {
                notificationBox.style.display = 'none';
            }, 300);
        }
    });
});