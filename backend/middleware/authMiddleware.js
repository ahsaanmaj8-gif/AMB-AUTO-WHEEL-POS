const userModel = require("../models/userModel");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// ============ MIDDLEWARE TO VERIFY JWT TOKEN ============
const requireSignIn = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Check if authorization header exists
    if (!authHeader) {
      return res.status(401).send({
        success: false,
        message: "Authorization token is required",
      });
    }

    // Extract token (Bearer token format)
    const token = authHeader.split(" ")[1];
    
    // Check if token exists after Bearer
    if (!token) {
      return res.status(401).send({
        success: false,
        message: "Token format is invalid. Expected: Bearer <token>",
      });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // ✅ Attach user info to request object
    req.user = decoded;
    next();

  } catch (error) {
    console.error("JWT verification error:", error.message);
    res.status(401).send({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

// ============ MIDDLEWARE TO CHECK IF USER IS ADMIN ============
const isAdmin = async (req, res, next) => {
  try {
    const user = await userModel.findById(req.user.id);
    
    if (!user) {
      return res.status(401).send({
        success: false,
        message: "User not found",
      });
    }

    // Check if user has admin role (role === 1)
    if (user.role !== 1) {
      return res.status(403).send({
        success: false,
        message: "Unauthorized Access! You are not admin",
      });
    }

    next();

  } catch (error) {
    console.error("Admin check error:", error.message);
    res.status(500).send({
      success: false,
      message: "Error in admin authorization",
      error: error.message,
    });
  }
};

// ============ MIDDLEWARE TO CHECK IF USER IS STAFF OR ADMIN ============
const isStaff = async (req, res, next) => {
  try {
    const user = await userModel.findById(req.user.id);
    
    if (!user) {
      return res.status(401).send({
        success: false,
        message: "User not found",
      });
    }

    // Allow both staff (role === 0) and admin (role === 1)
    if (user.role !== 0 && user.role !== 1) {
      return res.status(403).send({
        success: false,
        message: "Unauthorized Access! Staff or Admin required",
      });
    }

    next();

  } catch (error) {
    console.error("Staff check error:", error.message);
    res.status(500).send({
      success: false,
      message: "Error in staff authorization",
      error: error.message,
    });
  }
};

// ============ ✅ NEW: GET WORKSHOP ID FROM USER ============
// ============ GET WORKSHOP ID FROM USER ============
const getWorkshopId = async (req, res, next) => {
    try {
        // ✅ CHECK if req.user exists first
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "User not authenticated"
            });
        }

        const user = await userModel.findById(req.user.id);
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found",
            });
        }

        // ✅ Attach workshopId to request
        req.workshopId = user.workshopId;
        next();

    } catch (error) {
        console.error("Workshop check error:", error.message);
        res.status(500).json({
            success: false,
            message: "Error in workshop authorization",
            error: error.message,
        });
    }
};

module.exports = {
  requireSignIn,
  isAdmin,
  isStaff,
  getWorkshopId  // ✅ EXPORT NEW MIDDLEWARE
};