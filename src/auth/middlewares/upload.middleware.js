const multer = require('multer');
const path = require('path');

// Định nghĩa nơi lưu trữ file ảnh
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

// Tạo middleware upload
const upload = multer({ storage });

module.exports = upload;
