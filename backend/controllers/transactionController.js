const Transaction = require("../models/transactionModel");

// ============ GET ALL TRANSACTIONS ============
const getAllTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find({ 
            workshopId: req.user.workshopId  // ✅ ADD WORKSHOP FILTER
        })
            .populate("product", "name sku")
            .populate("serviceId", "customerName vehicleNumber")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            total: transactions.length,
            transactions: transactions,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============ GET TRANSACTIONS BY PRODUCT ============
const getTransactionsByProduct = async (req, res) => {
    try {
        const transactions = await Transaction.find({
            product: req.params.productId,
            workshopId: req.user.workshopId  // ✅ ADD WORKSHOP FILTER
        })
            .populate("performedBy", "name")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            total: transactions.length,
            transactions: transactions,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============ GET TRANSACTIONS BY TYPE ============
const getTransactionsByType = async (req, res) => {
    try {
        const transactions = await Transaction.find({
            type: req.params.type,
            workshopId: req.user.workshopId  // ✅ ADD WORKSHOP FILTER
        })
            .populate("product", "name sku")
            .populate("performedBy", "name");

        res.status(200).json({
            success: true,
            total: transactions.length,
            transactions: transactions,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============ GET TODAY'S TRANSACTIONS ============
const getTodayTransactions = async (req, res) => {
    try {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const transactions = await Transaction.find({
            workshopId: req.user.workshopId,  // ✅ ADD WORKSHOP FILTER
            createdAt: { $gte: startOfDay, $lte: endOfDay },
        })
            .populate("product", "name sku")
            .populate("performedBy", "name");

        res.status(200).json({
            success: true,
            date: new Date().toDateString(),
            total: transactions.length,
            transactions: transactions,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============ GET TRANSACTIONS (Alias) ============
const getTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find({ 
            workshopId: req.user.workshopId  // ✅ ADD WORKSHOP FILTER
        })
            .populate("product", "name sku")
            .populate("performedBy", "name")
            .populate("serviceId", "customerName vehicleNumber")
            .sort({ createdAt: -1 });
            
        res.status(200).json({ 
            success: true, 
            transactions: transactions 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// ============ DELETE SINGLE TRANSACTION ============
const deleteTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.findOne({ 
            _id: req.params.id, 
            workshopId: req.user.workshopId  // ✅ ADD WORKSHOP FILTER
        });
        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: "Transaction not found",
            });
        }
        await transaction.deleteOne();
        res.status(200).json({ 
            success: true, 
            message: "Transaction deleted successfully" 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// ============ DELETE TRANSACTIONS BY MONTH ============
const deleteTransactionsByMonth = async (req, res) => {
    try {
        const { year, month } = req.params;
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);
        
        const result = await Transaction.deleteMany({
            workshopId: req.user.workshopId,  // ✅ ADD WORKSHOP FILTER
            createdAt: { $gte: startDate, $lte: endDate },
        });
        
        res.status(200).json({
            success: true,
            message: `${result.deletedCount} transactions deleted`,
            deletedCount: result.deletedCount,
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// ============ DELETE ALL TRANSACTIONS ============
const deleteAllTransactions = async (req, res) => {
    try {
        const result = await Transaction.deleteMany({ 
            workshopId: req.user.workshopId  // ✅ ADD WORKSHOP FILTER
        });
        res.status(200).json({
            success: true,
            message: `${result.deletedCount} transactions deleted`,
            deletedCount: result.deletedCount,
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

module.exports = {
    getAllTransactions,
    getTransactionsByProduct,
    getTransactionsByType,
    getTodayTransactions,
    getTransactions,
    deleteTransaction,
    deleteTransactionsByMonth,
    deleteAllTransactions,
};