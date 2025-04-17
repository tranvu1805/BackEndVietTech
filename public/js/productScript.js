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

// Thiết lập event listeners khi DOM đã tải
// window.addEventListener('DOMContentLoaded', function() {
//     // Gọi API lấy thông báo
    
// });