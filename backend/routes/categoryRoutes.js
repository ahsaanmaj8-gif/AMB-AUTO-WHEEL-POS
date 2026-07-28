const express = require("express");
const router = express.Router();
const { requireSignIn, isAdmin } = require("../middleware/authMiddleware");
const {
    createCategory,
    getAllCategories,
    getCategoryById,
    updateCategory,
    deleteCategory
} = require("../controllers/categoryController");

// ============ PUBLIC ROUTES ============
// Get all categories (anyone can view)
router.get("/", getAllCategories);

// Get single category (anyone can view)
router.get("/:id", getCategoryById);


// Create category (admin only)
router.post("/", requireSignIn, isAdmin, createCategory);

// Update category (admin only)
router.put("/:id", requireSignIn, isAdmin, updateCategory);

// Delete category (admin only)
router.delete("/:id", requireSignIn, isAdmin, deleteCategory);

module.exports = router;