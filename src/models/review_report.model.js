const mongoose = require("mongoose");

const ReviewReportSchema = new mongoose.Schema(
    {
        review_id: { type: mongoose.Schema.Types.ObjectId, ref: "review", required: true },
        account_id: { type: mongoose.Schema.Types.ObjectId, ref: "account", required: true }, // Người báo cáo
        reason: { type: String, required: true }, // Lý do báo cáo
        status: { type: String, enum: ["active", "reported"], default: "pending" } // Trạng thái xử lý
    },
    { timestamps: true }
);

module.exports = mongoose.model("review_report", ReviewReportSchema);
