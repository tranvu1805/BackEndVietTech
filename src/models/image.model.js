const { Schema, model } = require('mongoose');

// Định nghĩa schema cho Image
const imageSchema = new Schema({
    file_name: { type: String, required: true }, // Tên file ảnh
    file_path: { type: String, required: true }, // Đường dẫn đến file ảnh (ví dụ: 'uploads/xyz.png')
    file_size: { type: Number, required: true }, // Kích thước file ảnh
    file_type: { type: String, required: true }, // Loại file (JPEG, PNG, ...)
    uploaded_at: { type: Date, default: Date.now }, // Thời gian upload
    url: { type: String, required: true }, // URL của ảnh để truy cập qua HTTP
}, { timestamps: true });

// Tạo model cho Image
const Image = model('Image', imageSchema);

module.exports = Image;
