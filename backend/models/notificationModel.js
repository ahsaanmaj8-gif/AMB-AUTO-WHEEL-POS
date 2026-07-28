const mongoose = require("mongoose");

const notificationSchema = mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ["low-stock", "service", "invoice", "general"],
        default: "general"
    },
    link: {
        type: String,
        default: "/"
    },
    read: {
        type: Boolean,
        default: false
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model("notifications", notificationSchema);