const mongoose = require("mongoose");
const DOCUMEBT_NAME = 'apikey'
const COLLECTION_NAME = 'apikeys'
const apiKeySchema = new mongoose.Schema(
    {
        key: {
            type: String,
            required: true,
            unique: true
        },
        status: {
            type: Boolean,
            default: true
        },
        permissions: {
            type: [String],
            required: true,
            enum: ['0000', '1111', '2222']
        }
    },
    {
        timestamps: true,
        collection: COLLECTION_NAME
    }
);

module.exports = mongoose.model(DOCUMEBT_NAME, apiKeySchema);
