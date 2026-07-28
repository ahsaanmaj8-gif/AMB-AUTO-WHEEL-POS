const express = require("express");
const router = express.Router();
const { requireSignIn } = require("../middleware/authMiddleware");

const { updateProfile, updatePassword } = require("../controllers/authController");


// Routes
router.put("/profile", requireSignIn, updateProfile);
router.put("/password", requireSignIn, updatePassword);

module.exports = router;