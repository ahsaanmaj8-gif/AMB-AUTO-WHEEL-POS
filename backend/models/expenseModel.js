const mongoose = require("mongoose");

const expenseSchema = mongoose.Schema({
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    category: {
        type: String,
        enum: ["rent", "electricity", "salaries", "stationery", "maintenance", "marketing", "other"],
        default: "other"
    },
    notes: {
        type: String,
        trim: true
    },
    addedBy: {
        type: String,
        required: true
    },
     workshopId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "workshop",
        required: true
    }
}, { timestamps: true });

expenseSchema.index({ workshopId: 1, date: -1 });

module.exports = mongoose.model("expenses", expenseSchema);