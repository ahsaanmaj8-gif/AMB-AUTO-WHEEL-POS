const express = require("express");
const router = express.Router();
const { requireSignIn, isAdmin } = require("../middleware/authMiddleware");
const {
    getAllTransactions,
    getTransactionsByProduct,
    getTransactionsByType,
    getTodayTransactions
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

module.exports = router;