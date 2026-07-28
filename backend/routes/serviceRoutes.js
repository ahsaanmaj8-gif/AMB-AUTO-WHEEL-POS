const express = require("express");
const router = express.Router();
const { requireSignIn, isAdmin, isStaff } = require("../middleware/authMiddleware");
const {
    createService,
    getAllServices,
    getTodayServices,
    getServiceById,
    updateService,
    generateBill,
    getServiceStats,
    getAllServicesWithInvoice,
    payRemaining
} = require("../controllers/serviceController");

// ============ ALL ROUTES REQUIRE LOGIN ============
router.use(requireSignIn);

// Get all services
router.get("/", getAllServices);

// Get today's services
router.get("/today", getTodayServices);

// Get service statistics
router.get("/stats", getServiceStats);

// Create new service
router.post("/", createService);

// Get single service
router.get("/:id", getServiceById);

// Update service
router.put("/:id", updateService);

// Generate bill for service
router.post("/:id/generate-bill", generateBill);

// Pay remaining balance
router.post("/:id/pay-remaining", payRemaining);

module.exports = router;