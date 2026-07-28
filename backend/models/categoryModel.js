const mongoose = require("mongoose");

const categorySchema = mongoose.Schema({
    // Category name (e.g., Engine Parts, Brakes, Tires)
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    
    // Brief description of the category (optional)
    description: {
        type: String,
        trim: true
    },
    
    // SEO friendly URL slug (e.g., "engine-parts")
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    }
}, { timestamps: true });

module.exports = mongoose.model("categories", categorySchema);