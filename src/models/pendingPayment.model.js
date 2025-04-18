const mongoose = require('mongoose');

const pendingPaymentSchema = new mongoose.Schema({
  order_code: { type: String, required: true, unique: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'account' },
  products: [Object],
  address: String,
  total: Number,
  shipping_fee: Number,
  phone_number: String,
  receiver_name: String,
  discount_code: String,
  discount_amount: Number,
  cart_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Cart' },
  createdAt: { type: Date, default: Date.now, expires: 3600 }, // Tự xóa sau 1 giờ
});

module.exports = mongoose.model('PendingPayment', pendingPaymentSchema);
