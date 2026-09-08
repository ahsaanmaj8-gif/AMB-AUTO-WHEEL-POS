const Expense = require("../models/expenseModel");

// ============ ADD EXPENSE ============
const addExpense = async (req, res) => {
    try {
        const { date, description, amount, category, notes } = req.body;

        if (!description || !amount) {
            return res.status(400).json({
                success: false,
                message: "Description and amount are required"
            });
        }

        const expense = new Expense({
            date: date || new Date(),
            description,
            amount: parseFloat(amount),
            category: category || "other",
            notes: notes || "",
            addedBy: req.user.name || req.user.id,
            workshopId: req.user.workshopId  // ✅ ADD THIS
        });

        await expense.save();

        res.status(201).json({
            success: true,
            message: "Expense added successfully",
            expense
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============ GET ALL EXPENSES ============
const getExpenses = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        let filter = { workshopId: req.user.workshopId };  // ✅ ADD WORKSHOP FILTER
        
        if (startDate && endDate) {
            filter.date = {
                $gte: new Date(startDate),
                $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
            };
        }

        const expenses = await Expense.find(filter).sort({ date: -1 });
        
        // Calculate total expenses
        const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

        res.status(200).json({
            success: true,
            totalExpenses,
            count: expenses.length,
            expenses
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============ DELETE EXPENSE ============
const deleteExpense = async (req, res) => {
    try {
        const expense = await Expense.findOne({ 
            _id: req.params.id, 
            workshopId: req.user.workshopId  // ✅ ADD WORKSHOP FILTER
        });
        if (!expense) {
            return res.status(404).json({
                success: false,
                message: "Expense not found"
            });
        }

        await expense.deleteOne();
        res.status(200).json({
            success: true,
            message: "Expense deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============ UPDATE EXPENSE ============
const updateExpense = async (req, res) => {
    try {
        const expense = await Expense.findOne({ 
            _id: req.params.id, 
            workshopId: req.user.workshopId  // ✅ ADD WORKSHOP FILTER
        });
        if (!expense) {
            return res.status(404).json({
                success: false,
                message: "Expense not found"
            });
        }

        const updatedExpense = await Expense.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: "Expense updated successfully",
            expense: updatedExpense
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    addExpense,
    getExpenses,
    deleteExpense,
    updateExpense
};