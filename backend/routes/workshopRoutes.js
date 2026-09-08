const express = require("express");
const router = express.Router();
const { requireSignIn, isAdmin, getWorkshopId } = require("../middleware/authMiddleware");
const Workshop = require("../models/workshopModel");

// ============ GET WORKSHOP DETAILS ============
const getWorkshop = async (req, res) => {
    try {
        const workshop = await Workshop.findById(req.user.workshopId);
        if (!workshop) {
            return res.status(404).json({
                success: false,
                message: "Workshop not found"
            });
        }
        res.status(200).json({
            success: true,
            workshop
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============ UPDATE WORKSHOP ============
const updateWorkshop = async (req, res) => {
    try {
        const workshop = await Workshop.findByIdAndUpdate(
            req.user.workshopId,
            req.body,
            { new: true, runValidators: true }
        );
        if (!workshop) {
            return res.status(404).json({
                success: false,
                message: "Workshop not found"
            });
        }
        res.status(200).json({
            success: true,
            message: "Workshop updated successfully",
            workshop
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============ ROUTES ============
router.use(requireSignIn);
router.use(getWorkshopId);

router.get("/", getWorkshop);
router.put("/", updateWorkshop);

module.exports = router;