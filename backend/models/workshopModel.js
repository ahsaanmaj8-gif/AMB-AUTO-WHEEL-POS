const mongoose = require("mongoose");

const workshopSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    ownerName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phone: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    city: {
        type: String,
        default: ""
    },
    logo: {
        type: String,
        default: ""
    },
    subscription: {
        plan: {
            type: String,
            enum: ["free", "basic", "premium", "enterprise"],
            default: "free"
        },
        startDate: {
            type: Date,
            default: Date.now
        },
        expiryDate: {
            type: Date
        },
        status: {
            type: String,
            enum: ["active", "inactive", "expired"],
            default: "active"
        }
    },
    settings: {
        taxRate: {
            type: Number,
            default: 0
        },
        currency: {
            type: String,
            default: "PKR"
        },
        invoicePrefix: {
            type: String,
            default: "INV"
        }
    },
    status: {
        type: String,
        enum: ["active", "inactive", "suspended"],
        default: "active"
    },



    

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users"
    },


     invoiceSettings: {
        headerImage: {
            type: String,
            default: ""
        },
        footerImage: {
            type: String,
            default: ""
        },
        logo: {
            type: String,
            default: ""
        },
        companyName: {
            type: String,
            default: ""
        },
        companyPhone: {
            type: String,
            default: ""
        },
        companyEmail: {
            type: String,
            default: ""
        },
        companyAddress: {
            type: String,
            default: ""
        },
        signatureName: {
            type: String,
            default: ""
        },
        termsAndConditions: {
            type: String,
            default: "1. Payments must be made in full by the due date specified on the invoice.\n2. All products and services are provided 'as-is' and are subject to availability.\n3. Claims regarding defective goods or services must be submitted within 7 days of receipt.\n4. Warranties are only applicable as per manufacturer's policy.\n5. Custom orders and special services are non-refundable."
        },
        paymentDetails: {
            bankName: {
                type: String,
                default: ""
            },
            accountName: {
                type: String,
                default: ""
            },
            accountNumber: {
                type: String,
                default: ""
            },
            iban: {
                type: String,
                default: ""
            }
        }
    }
}, { timestamps: true });

module.exports = mongoose.model("workshop", workshopSchema);