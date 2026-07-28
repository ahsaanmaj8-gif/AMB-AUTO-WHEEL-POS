const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
    // Full name of the user
    name: {
        type: String,
        required: true,
        trim: true // removes extra spaces
    },
    
    // Email address for login
    email: {
        type: String,
        required: true,
        unique: true // no two users can have same email
    },
    
    // Password (will be encrypted)
    password: {
        type: String,
        required: true
    },
    
    // Phone number
    phone: {
        type: String,
        required: true
    },
    
    // Complete address
    address: {
        type: {},
        required: true
    },
    
    // Security answer for password reset
    answer: {
        type: String,
        required: true
    },
    
    // User role: 0 = staff, 1 = admin
    role: {
        type: Number,
        default: 0
    }
}, { timestamps: true }); // auto adds createdAt & updatedAt

module.exports = mongoose.model("users", userSchema);