const mongoose = require("mongoose");
const DOCUMEBT_NAME = 'role'
const COLLECTION_NAME = 'roles'
const RoleSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, unique: true },
    },
    {
        timestamps: true,
        COLLECTION_NAME
    }
);

module.exports = mongoose.model(DOCUMEBT_NAME, RoleSchema);
