const mongoose = require('mongoose');
const { Types } = mongoose;
const DOCUMENT_NAME = 'Log';
const COLLECTION_NAME = 'Logs';

const ActionLogSchema = new mongoose.Schema({
  target_type: {
    type: String, // Ví dụ: 'Bill', 'Product', 'User', ...
    required: true,
  },
  target_id: {
    type: Types.ObjectId,
    required: true,
  },
  action: {
    type: String, // Ví dụ: 'status_change', 'update', 'delete'
    required: true,
  },
  before: {
    type: mongoose.Schema.Types.Mixed, // trạng thái hoặc dữ liệu trước
  },
  after: {
    type: mongoose.Schema.Types.Mixed, // trạng thái hoặc dữ liệu sau
  },
  changed_by: {
    type: Types.ObjectId,
    ref: 'account',
  },
  changed_at: {
    type: Date,
    default: Date.now,
  },
  note: {
    type: String, // ghi chú tự do nếu cần
  }
}, {
  timestamps: true,
  collection: COLLECTION_NAME,
});

module.exports = mongoose.model(DOCUMENT_NAME, ActionLogSchema);
