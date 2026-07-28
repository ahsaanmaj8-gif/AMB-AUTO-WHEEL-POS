const mongoose = require("mongoose");

const serviceSchema = mongoose.Schema({
    // ---------- CUSTOMER INFORMATION ----------
    customerName: {
        type: String,
        required: true,
        trim: true
    },
    customerPhone: {
        type: String,
        required: true,
        trim: true
    },
    customerAddress: {
        type: String,
        trim: true
    },
    
    // ---------- VEHICLE INFORMATION ----------
    vehicleNumber: {
        type: String,
        required: true,
        trim: true, // license plate
        index: true // for quick search
    },
    vehicleModel: {
        type: String,
        required: true,
        trim: true // e.g., "Toyota Corolla 2020"
    },
    vehicleMake: {
        type: String,
        trim: true // e.g., "Toyota"
    },
    mileage: {
        type: Number // current vehicle mileage
    },
    
    // ---------- SERVICES PERFORMED (LABOR) ----------
    services: [{
        serviceName: {
            type: String,
            required: true // e.g., "Oil Change"
        },
        description: {
            type: String // detailed description
        },
        laborHours: {
            type: Number,
            default: 1
        },
        laborRate: {
            type: Number,
            default: 500 // per hour rate
        },
        servicePrice: {
            type: Number,
            required: true // total price for this service
        }
    }],
    
    // ---------- PARTS USED FROM INVENTORY ----------
    partsUsed: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "products"
        },
        productName: {
            type: String,
            required: true // store name at time of service
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        unitPrice: {
            type: Number,
            required: true // price at time of service
        },
        totalPrice: {
            type: Number,
            required: true // quantity * unitPrice
        },
        fromInventory: {
            type: Boolean,
            default: true // true = deduct from stock, false = not in inventory
        }
    }],
    
    // ---------- ADDITIONAL CHARGES ----------
    additionalCharges: [{
        description: {
            type: String,
            required: true
        },
        amount: {
            type: Number,
            required: true
        }
    }],
    
    // ---------- BILLING INFORMATION ----------
    billing: {
        subtotal: {
            type: Number,
            required: true // services + parts + charges total
        },
        tax: {
            type: Number,
            default: 0 // tax amount
        },
        taxRate: {
            type: Number,
            default: 0 // tax percentage
        },
        discount: {
            type: Number,
            default: 0 // discount amount
        },
        discountType: {
            type: String,
            enum: ["percentage", "fixed"],
            default: "fixed"
        },
        totalAmount: {
            type: Number,
            required: true // final amount to pay
        },
        paidAmount: {
            type: Number,
            default: 0 // amount already paid
        },
        balance: {
            type: Number,
            default: 0 // remaining amount
        },
        paymentStatus: {
            type: String,
            enum: ["paid", "partial", "unpaid"],
            default: "unpaid"
        },
        paymentMethod: {
            type: String,
            enum: ["cash", "card", "bank-transfer", "other"],
            default: "cash"
        }
    },
    
    // ---------- SERVICE STATUS ----------
    status: {
        type: String,
        enum: ["pending", "in-progress", "completed", "cancelled", "delivered"],
        default: "pending"
    },
    
    // ---------- NOTES ----------
    notes: {
        type: String,
        trim: true // customer notes
    },
    mechanicNotes: {
        type: String,
        trim: true // internal mechanic notes
    },
    
    // ---------- ASSIGNED USERS ----------
    assignedTo: {

        //in later i will proper register staff like mechanic then just by select mechanic like staff id then id attach now manually input field for name add which person do this service
        //type: mongoose.Schema.Types.ObjectId,
        //ref: "users",
        //required: true // mechanic assigned to this service
        type: String,
        required: true // mechanic assigned to this service
    },
    performedBy: {
        //i did this because i was getting error when i was trying to get the user id from req.user._id so i used this method to get the user id from local storage
        // type: mongoose.Schema.Types.ObjectId,
        // ref: "users",
        type: String,
        required: true // who created/updated this service
    },
    
    // ---------- DATES ----------
    serviceDate: {
        type: Date,
        default: Date.now // when service started
    },
    completedAt: {
        type: Date // when service was completed
    },
    deliveryDate: {
        type: Date // when vehicle was delivered
    }
}, { timestamps: true });

// Index for quick searches
serviceSchema.index({ vehicleNumber: 1, customerName: 1 });

module.exports = mongoose.model("services", serviceSchema);