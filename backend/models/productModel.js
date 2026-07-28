const mongoose = require("mongoose");

const productSchema = mongoose.Schema({
    // Product name
    name: {
        type: String,
        required: true,
        trim: true
    },
    
    // SEO friendly URL slug
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    
    // Detailed product description
    description: {
        type: String,
        required: true,
        trim: true
    },
    
    // Selling price to customers
    price: {
        type: Number,
        required: true
    },
    
    // Purchase cost from supplier
    costPrice: {
        type: Number,
        default: 0
    },
    
    // Category this product belongs to
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "categories",
        required: true
    },
    
    // Current quantity in stock
    quantity: {
        type: Number,
        required: true,
        default: 0
    },
    
    // Minimum stock level (alert when below this)
    minQuantity: {
        type: Number,
        required: true,
        default: 5
    },
    
    // Unique SKU (Stock Keeping Unit) code
    sku: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    
    // Supplier name or company
    supplier: {
        type: String,
        trim: true
    },
    
    // Storage location in workshop
    location: {
        type: String,
        enum: ["warehouse", "shop-floor", "storage"],
        default: "shop-floor"
    },
    
    // Unit of measurement (pcs, kg, liter, etc.)
    unit: {
        type: String,
        default: "pcs"
    },
    
    // Product image URL
    photo: {
        type: String
    },
    
    // Product status: active or inactive
    status: {
        type: String,
        enum: ["active", "inactive"],
        default: "active"
    },
     // Track last stock update
    lastStockUpdate: {
        type: Date
    }
}, { timestamps: true });

module.exports = mongoose.model("products", productSchema);