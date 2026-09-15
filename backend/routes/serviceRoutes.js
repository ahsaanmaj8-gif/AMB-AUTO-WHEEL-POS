const express = require("express");
const router = express.Router();
const { requireSignIn, isAdmin, isStaff , getWorkshopId } = require("../middleware/authMiddleware");
const {
    createService,
    getAllServices,
    getTodayServices,
    getServiceById,
    updateService,
    generateBill,
    getServiceStats,
    getAllServicesWithInvoice,
    payRemaining,
    getCustomerByPhone,
    deleteService,
    getCustomerByVehicle
} = require("../controllers/serviceController");

// ============ ALL ROUTES REQUIRE LOGIN ============
router.use(requireSignIn);
router.use(getWorkshopId);  


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

router.get("/vehicle/:vehicleNumber", getCustomerByVehicle);

// Delete service
router.delete("/:id", deleteService);

// Generate bill for service
router.post("/:id/generate-bill", generateBill);

// Pay remaining balance
router.post("/:id/pay-remaining", payRemaining);

router.get("/customer/:phone" , getCustomerByPhone);

module.exports = router;