const mongoose = require("mongoose");

const alertSchema = mongoose.Schema({
    // Which product is low in stock
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "products",
        required: true
    },
    
    // Type of alert
    type: {
        type: String,
        enum: ["low-stock", "out-of-stock", "expiry"],
        required: true
    },
    
    // Alert message
    message: {
        type: String,
        required: true,
        trim: true
    },
    
    // Has admin seen this alert?
    isRead: {
        type: Boolean,
        default: false
    },
    
    // Alert status: active or resolved
    status: {
        type: String,
        enum: ["active", "resolved"],
        default: "active"
    }
}, { timestamps: true });

module.exports = mongoose.model("alerts", alertSchema);