const mongoose = require("mongoose");

const reminderSchema = mongoose.Schema({
    // Customer info (jo message bhejna hai)
    customerName: {
        type: String,
        required: true,
        trim: true
    },
    customerPhone: {
        type: String,
        required: true,
        trim: true
        // Format: 923001234567 (country code + number, no +, no spaces)
    },
    vehicleNumber: {
        type: String,
        trim: true
    },
    vehicleModel: {
        type: String,
        trim: true
    },

    // Oil change ki date
    lastOilChangeDate: {
        type: Date,
        required: true
    },

    // Jab message bhejna hai
    reminderDate: {
        type: Date,
        required: true,
        index: true // Quick search ke liye
    },

    // Reminder ka status
    status: {
        type: String,
        enum: ["pending", "sent", "cancelled", "failed"],
        default: "pending",
        index: true
    },

    // Kitne din baad reminder (default 30 days)
    reminderAfterDays: {
        type: Number,
        default: 30
    },

    // Custom message (agar khali ho to default template use hoga)
    customMessage: {
        type: String,
        trim: true,
        default: ""
    },

    // Kab bheja gaya
    sentAt: {
        type: Date
    },

    // Error agar fail hua
    errorMessage: {
        type: String,
        default: ""
    },


    lastAttemptAt: {
    type: Date,
    default: null
},
retryCount: {
    type: Number,
    default: 0
},

    // Multi-tenant
    workshopId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "workshop",
        required: true
    },

    // Service reference (kis service se bana)
    serviceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "services"
    }
}, { timestamps: true });

// Index for fast cron queries
reminderSchema.index({ status: 1, reminderDate: 1 });

module.exports = mongoose.model("reminders", reminderSchema);