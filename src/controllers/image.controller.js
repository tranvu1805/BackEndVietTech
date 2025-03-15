const Image = require('../models/image.model');
const Product = require('../models/product.model');

// Upload ảnh
const uploadImage = async (req, res) => {
    try {
        const { file } = req;

        if (!file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        // Tạo URL cho ảnh đã upload
        const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;

        // Lưu thông tin ảnh vào cơ sở dữ liệu
        const image = new Image({
            file_name: file.originalname,
            file_path: file.path,
            file_size: file.size,
            file_type: file.mimetype,
            url: imageUrl,  // Thêm URL vào cơ sở dữ liệu
        });

        await image.save();
        res.status(201).json({ success: true, image });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Gán ảnh vào sản phẩm
const addImageToProduct = async (req, res) => {
    const { productId, imageId } = req.body;
    try {
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Kiểm tra xem imageId có hợp lệ không
        const image = await Image.findById(imageId);
        if (!image) {
            return res.status(404).json({ success: false, message: 'Image not found' });
        }

        // Thêm imageId vào mảng image_ids của sản phẩm
        product.image_ids.push(imageId);
        await product.save();

        res.status(200).json({ success: true, product });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { uploadImage, addImageToProduct };
