const express = require("express");
const router = express.Router();
const { requireSignIn, isAdmin, getWorkshopId } = require("../middleware/authMiddleware");
const {
    createCategory,
    getAllCategories,
    getCategoryById,
    updateCategory,
    deleteCategory
} = require("../controllers/categoryController");

// ============ ✅ CORRECT ORDER ============
// First - Verify token (sets req.user)
router.use(requireSignIn);

// Second - Get workshopId (now req.user exists)
router.use(getWorkshopId);

// ============ PROTECTED ROUTES ============
// Get all categories
router.get("/", getAllCategories);

// Get single category
router.get("/:id", getCategoryById);

// ============ ADMIN ONLY ROUTES ============
router.post("/", isAdmin, createCategory);
router.put("/:id", isAdmin, updateCategory);
router.delete("/:id", isAdmin, deleteCategory);

module.exports = router;