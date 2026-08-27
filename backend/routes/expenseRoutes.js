const express = require("express");
const router = express.Router();
const { requireSignIn, isAdmin } = require("../middleware/authMiddleware");
const {
    addExpense,
    getExpenses,
    deleteExpense,
    updateExpense
} = require("../controllers/expenseController");

router.use(requireSignIn);

router.post("/", addExpense);
router.get("/", getExpenses);
router.delete("/:id", deleteExpense);
router.put("/:id", updateExpense);

module.exports = router;