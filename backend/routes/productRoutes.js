const express = require("express");
const router = express.Router();
const { requireSignIn, isAdmin, isStaff, getWorkshopId } = require("../middleware/authMiddleware");
const {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    updateStock,
    getLowStockProducts
} = require("../controllers/productController");

// ============ ✅ CORRECT ORDER ============
// First - Verify token (sets req.user)
router.use(requireSignIn);

// Second - Get workshopId (now req.user exists)
router.use(getWorkshopId);

// ============ PROTECTED ROUTES ============
// Get all products
router.get("/", getAllProducts);

// Get low stock products
router.get("/low-stock", getLowStockProducts);

// Get single product
router.get("/:id", getProductById);

// ============ ADMIN ONLY ROUTES ============
router.post("/", isAdmin, createProduct);
router.put("/:id", isAdmin, updateProduct);
router.delete("/:id", isAdmin, deleteProduct);
router.put("/:id/stock", isAdmin, updateStock);

module.exports = router;