const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const DOCUMENT_NAME = 'Notification';
const COLLECTION_NAME = 'Notifications';

const notificationSchema = new Schema({
    receiverId: {
        type: Schema.Types.ObjectId,
        ref: 'account', // hoặc 'User'
        required: true
    },
    senderId: {
        type: Schema.Types.ObjectId,
        ref: 'account', // ai gửi thông báo (admin, hệ thống...)
        default: null
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['system', 'order', 'promotion', 'custom'], default: 'custom' },
    url: { type: String, default: null }, // link cho web
    data: { type: Object, default: {} }, // data cho mobile app nếu cần
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
},{
    timestamps: true,
    collection: COLLECTION_NAME
});

module.exports = mongoose.model(DOCUMENT_NAME, notificationSchema);
