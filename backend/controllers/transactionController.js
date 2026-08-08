const Transaction = require("../models/transactionModel");

// @desc    Get all transactions
// @route   GET /api/transactions
// @access  Private
const getAllTransactions = async (req, res) => {
  try {
    // console.log("hello")
    const transactions = await Transaction.find({})
      .populate("product", "name sku")
      // .populate("performedBy", "name")
      .populate("serviceId", "customerName vehicleNumber")
      .sort({ createdAt: -1 });
    // console.log("hello")

    // console.log("Transactions fetched:", transactions);

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

// @desc    Get transactions by product
// @route   GET /api/transactions/product/:productId
// @access  Private
const getTransactionsByProduct = async (req, res) => {
  try {
    const transactions = await Transaction.find({
      product: req.params.productId,
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

// @desc    Get transactions by type
// @route   GET /api/transactions/type/:type
// @access  Private
const getTransactionsByType = async (req, res) => {
  try {
    const transactions = await Transaction.find({
      type: req.params.type,
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

// @desc    Get today's transactions
// @route   GET /api/transactions/today
// @access  Private
const getTodayTransactions = async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const transactions = await Transaction.find({
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

const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate("product", "name sku")
      .populate("performedBy", "name")
      .populate("serviceId", "customerName vehicleNumber")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, transactions: transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }
    await transaction.deleteOne();
    res
      .status(200)
      .json({ success: true, message: "Transaction deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteTransactionsByMonth = async (req, res) => {
  try {
    const { year, month } = req.params;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    const result = await Transaction.deleteMany({
      createdAt: { $gte: startDate, $lte: endDate },
    });
    res.status(200).json({
      success: true,
      message: `${result.deletedCount} transactions deleted`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteAllTransactions = async (req, res) => {
  try {
    const result = await Transaction.deleteMany({});
    res.status(200).json({
      success: true,
      message: `${result.deletedCount} transactions deleted`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
