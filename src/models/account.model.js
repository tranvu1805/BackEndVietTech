const mongoose = require("mongoose");
const DOCUMEBT_NAME = 'account'
const COLLECTION_NAME = 'accounts'
const AccountSchema = new mongoose.Schema(
    {
        username: { type: String, required: true, unique: true },
        full_name: { type: String, required: true },
        phone: { type: String, required: true, unique: true },
        address: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        role_id: { type: mongoose.Schema.Types.ObjectId, ref: "role", required: true }, 
    },
    {
        timestamps: true,
        collection: COLLECTION_NAME
    }
);

module.exports = mongoose.model(DOCUMEBT_NAME, AccountSchema);
