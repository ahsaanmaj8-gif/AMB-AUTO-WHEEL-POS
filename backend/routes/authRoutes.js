const express = require("express");
const router = express.Router();
const { requireSignIn } = require("../middleware/authMiddleware");
const {
    registerUser,
    loginUser,
    getCurrentUser,
    forgotPassword,
    checkEmail,
    verifyAnswer
} = require("../controllers/authController");

// ============ PUBLIC ROUTES ============
// Register new user
router.post("/register", registerUser);

// Login user
router.post("/login", loginUser);

// Forgot password
router.post("/forgot-password", forgotPassword);


router.get("/me", requireSignIn, getCurrentUser);


router.post("/check-email", checkEmail);        
router.post("/verify-answer", verifyAnswer);   


module.exports = router;