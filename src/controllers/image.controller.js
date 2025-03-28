const Image = require('../models/image.model');
const Product = require('../models/product.model');
const Account = require('../models/account.model');
const Review = require('../models/review.model');
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
const updateImageToAccount = async (req, res) => {
    const { accountId, imageId } = req.body;
    try {
        const account = await Account.findById(accountId);
        if (!account) {
            return res.status(404).json({ success: false, message: 'Account not found' });
        }

        const image = await Image.findById(imageId);
        if (!image) {
            return res.status(404).json({ success: false, message: 'Image not found' });
        }

        account.profile_image = imageId; // Cập nhật ảnh đại diện
        await account.save();

        res.status(200).json({ 
            success: true, 
            message: 'Profile image updated successfully', 
            account: {
                _id: account._id,
                username: account.username,
                email: account.email,
                profile_image: {
                    _id: image._id,
                    file_name: image.file_name,
                    file_path: image.file_path,
                    file_size: image.file_size,
                    file_type: image.file_type,
                    url: image.url,
                    uploaded_at: image.uploaded_at,
                    createdAt: image.createdAt,
                    updatedAt: image.updatedAt,
                    __v: image.__v
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};



// Gán ảnh vào review (có thể có nhiều ảnh)
const addImagesToReview = async (req, res) => {
    const { reviewId, imageIds } = req.body; // imageIds là một mảng chứa ID các ảnh
    try {
        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        const images = await Image.find({ _id: { $in: imageIds } });
        if (images.length !== imageIds.length) {
            return res.status(404).json({ success: false, message: 'One or more images not found' });
        }

        review.image_ids.push(...imageIds);
        await review.save();

        res.status(200).json({ success: true, review });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
module.exports = { uploadImage, addImageToProduct, addImagesToReview,updateImageToAccount };
