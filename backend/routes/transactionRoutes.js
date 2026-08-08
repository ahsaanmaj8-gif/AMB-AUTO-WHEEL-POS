const express = require("express");
const router = express.Router();
const { requireSignIn, isAdmin } = require("../middleware/authMiddleware");
const {
  getAllTransactions,
  getTransactionsByProduct,
  getTransactionsByType,
  getTodayTransactions,
  deleteTransaction,
  deleteTransactionsByMonth,
  deleteAllTransactions,
} = require("../controllers/transactionController");

// ============ ALL ROUTES REQUIRE LOGIN ============
router.use(requireSignIn);

// Get all transactions
router.get("/", getAllTransactions);

// Get today's transactions
router.get("/today", getTodayTransactions);

// Get transactions by product
router.get("/product/:productId", getTransactionsByProduct);

// Get transactions by type
router.get("/type/:type", getTransactionsByType);

// DELETE single transaction 
router.delete("/:id", deleteTransaction); 

// DELETE transactions by month 
router.delete("/month/:year/:month", deleteTransactionsByMonth); 

// DELETE all transactions 
router.delete("/all", deleteAllTransactions);

module.exports = router;
