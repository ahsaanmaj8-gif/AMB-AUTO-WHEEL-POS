const express = require("express");
const router = express.Router();
const { requireSignIn, isAdmin, getWorkshopId } = require("../middleware/authMiddleware");
const {
    addExpense,
    getExpenses,
    deleteExpense,
    updateExpense
} = require("../controllers/expenseController");

router.use(requireSignIn);
router.use(getWorkshopId);

router.post("/", addExpense);
router.get("/", getExpenses);
router.delete("/:id", deleteExpense);
router.put("/:id", updateExpense);

module.exports = router;