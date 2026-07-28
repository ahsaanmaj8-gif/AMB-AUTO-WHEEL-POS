const mongoose = require("mongoose");

const transactionSchema = mongoose.Schema({
    // Which product is being transacted
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "products",
        required: true
    },
    
    // Type of transaction
    // purchase-in = bought from supplier
    // return-in = customer returned
    // service-out = used in service
    // sale-out = sold directly
    // adjustment = stock correction
    // wastage = damaged/expired
    type: {
        type: String,
        enum: ["purchase-in", "return-in", "service-out", "sale-out", "adjustment", "wastage"],
        required: true
    },
    
    // Quantity added or removed
    quantity: {
        type: Number,
        required: true
    },
    
    // Stock before this transaction
    previousQuantity: {
        type: Number
    },
    
    // Stock after this transaction
    newQuantity: {
        type: Number
    },
    
    // Reference number (invoice, PO, service ID, etc.)
    reference: {
        type: String,
        trim: true
    },
    
    // Additional notes
    notes: {
        type: String,
        trim: true
    },
    
    // Link to service if used in service
    serviceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "services"
    },
    
    // Which user performed this transaction
    performedBy: {
        //i did this because i was getting error when i was trying to get the user id from req.user._id so i used this method to get the user id from local storage, i will fix this later when staff member like mechanic will be able to login and perform transactions now admin just use this or we can also fix by doing admin also proper register like user register but in software web app anybody can register and use software but i can solve also this by just review form then i allow to register and use software now just nouman use this okay...
        // type: mongoose.Schema.Types.ObjectId,
        type: String,
        ref: "users",
        required: true
    },
    
    // Unit price at time of transaction
    unitPrice: {
        type: Number
    },
    
    // Total price (quantity * unitPrice)
    totalPrice: {
        type: Number
    }
}, { timestamps: true });

module.exports = mongoose.model("transactions", transactionSchema);