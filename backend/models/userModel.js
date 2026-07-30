const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: true,
    },
    address: {
        type: {},
        required: true,
    },
    answer: {
        type: String,
        required: true
    },
    role: {
        type: Number,
        default: 0 // 0 = staff, 1 = admin
    },
   
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationToken: {
        type: String,
        default: null
    },
    rejectionReason: {
        type: String,
        default: ""
    }
}, { timestamps: true });

module.exports = mongoose.model("users", userSchema);