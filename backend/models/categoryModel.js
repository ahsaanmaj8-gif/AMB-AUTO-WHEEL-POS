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
    ,
     workshopId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "workshop",
        required: true
    }
}, { timestamps: true });



categorySchema.index({ workshopId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("categories", categorySchema);