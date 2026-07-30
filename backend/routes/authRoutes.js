const express = require("express");
const router = express.Router();
const { requireSignIn, isAdmin } = require("../middleware/authMiddleware");
const {
    registerUser,
    loginUser,
    getCurrentUser,
    forgotPassword,
    checkEmail,
    verifyAnswer,
    // getPendingUsers,
    // approveUser,
    // rejectUser,
    // getAllUsers
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



// router.get("/pending-users",  isAdmin, getPendingUsers);
// router.get("/all-users",  isAdmin, getAllUsers);
// router.put("/approve-user/:userId",  isAdmin, approveUser);
// router.delete("/reject-user/:userId",  isAdmin, rejectUser);


module.exports = router;