const express = require("express");
const router = express.Router();
const { requireSignIn, isAdmin, isStaff } = require("../middleware/authMiddleware");
const {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    updateStock,
    getLowStockProducts
} = require("../controllers/productController");

// ============ PROTECTED ROUTES (All require login) ============
// Get all products
router.get("/", requireSignIn, getAllProducts);

// Get low stock products
router.get("/low-stock", requireSignIn, getLowStockProducts);

// Get single product
router.get("/:id", requireSignIn, getProductById);

// ============ ADMIN ONLY ROUTES ============
// Create product
router.post("/", requireSignIn, isAdmin, createProduct);

// Update product
router.put("/:id", requireSignIn, isAdmin, updateProduct);

// Delete product
router.delete("/:id", requireSignIn, isAdmin, deleteProduct);

// Update stock (admin only - can also be staff with permission)
router.put("/:id/stock", requireSignIn, isAdmin, updateStock);

module.exports = router;