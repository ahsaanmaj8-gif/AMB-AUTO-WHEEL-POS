const mongoose = require("mongoose");

const invoiceSchema = mongoose.Schema({
    // ---------- INVOICE IDENTIFICATION ----------
    invoiceNumber: {
        type: String,
        required: true,
        unique: true // e.g., INV-2024-00001
    },
    
    // Link to the service record
    service: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "services",
        required: true
    },
    
    // ---------- CUSTOMER INFORMATION ----------
    customerName: {
        type: String,
        required: true
    },
    customerPhone: {
        type: String,
        required: true
    },
    vehicleNumber: {
        type: String,
        required: true
    },
    
    // ---------- INVOICE ITEMS ----------
    items: [{
        type: {
            type: String,
            enum: ["service", "part", "charge"],
            required: true // what type of item
        },
        description: {
            type: String,
            required: true // item description
        },
        quantity: {
            type: Number,
            default: 1
        },
        unitPrice: {
            type: Number,
            required: true
        },
        totalPrice: {
            type: Number,
            required: true
        }
    }],
    
    // ---------- BILLING SUMMARY ----------
    subtotal: {
        type: Number,
        required: true // total before tax and discount
    },
    tax: {
        type: Number,
        default: 0
    },
    taxRate: {
        type: Number,
        default: 0
    },
    discount: {
        type: Number,
        default: 0
    },
    discountType: {
        type: String,
        enum: ["percentage", "fixed"],
        default: "fixed"
    },
    totalAmount: {
        type: Number,
        required: true // final amount
    },
    paidAmount: {
        type: Number,
        default: 0
    },
    balance: {
        type: Number,
        default: 0
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
    },
    
    // ---------- INVOICE STATUS ----------
    status: {
        type: String,
        enum: ["draft", "issued", "cancelled", "paid"],
        default: "draft"
    },
    
    // ---------- WHO ISSUED ----------
    issuedBy: {

        //in later i will proper register staff like mechanic then just by select mechanic like staff id then id attach now manually input field for name add which person do this service
        // type: mongoose.Schema.Types.ObjectId,
        // ref: "users",
        // required: true


        type: String,   
        required: true
    },
    
    // ---------- DATES ----------
    issuedDate: {
        type: Date,
        default: Date.now
    },
    dueDate: {
        type: Date
    },
    
    // ---------- NOTES ----------
    notes: {
        type: String,
        trim: true
    }
}, { timestamps: true });

module.exports = mongoose.model("invoices", invoiceSchema);