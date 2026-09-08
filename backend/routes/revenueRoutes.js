// backend/routes/revenueRoutes.js
const express = require("express");
const router = express.Router();
const { requireSignIn, getWorkshopId } = require("../middleware/authMiddleware");
const { getRevenueSummary } = require("../controllers/revenueController");

router.use(requireSignIn);
router.use(getWorkshopId); 


router.get("/summary", getRevenueSummary);

module.exports = router;