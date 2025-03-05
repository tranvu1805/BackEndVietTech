const mongoose = require("mongoose");
const DOCUMENT_NAME = 'keytoken'
const COLLECTION_NAME = 'keytokens'
const keyTokenSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "account", // Liên kết với bảng Account
      required: true,
    },
    privateKey: {
      type: String,
      required: true,
    },
    publicKey: {
      type: String,
      required: true,
    },
    refreshTokens: {
      type: [String], // Nếu bạn muốn lưu Refresh Tokens
      default: [],
    },
  },
  {  timestamps:true,
    collection:COLLECTION_NAME }
);

module.exports = mongoose.model(DOCUMENT_NAME, keyTokenSchema);
