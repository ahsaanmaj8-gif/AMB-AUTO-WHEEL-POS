const User = require("../models/userModel");
const Workshop = require("../models/workshopModel"); // ✅ ADD THIS
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Generate JWT Token
const generateToken = (id, email, name, workshopId, role, tokenVersion = 0) => {
    return jwt.sign({ 
        id, 
        email: email, 
        name: name, 
        workshopId: workshopId,  // ✅ ADD workshopId IN TOKEN
        role: role,
        tokenVersion
    }, process.env.JWT_SECRET, {
        expiresIn: "30d",
    });
};

// ============ REGISTER USER (With Workshop) ============
const registerUser = async (req, res) => {
    try {
        const { 
            name, 
            email, 
            password, 
            phone, 
            address, 
            answer,
            workshopName,      // ✅ NEW FIELD
            workshopPhone,     // ✅ NEW FIELD
            workshopAddress    // ✅ NEW FIELD
        } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User already exists with this email",
            });
        }

        // ✅ CREATE WORKSHOP FIRST
        const workshop = new Workshop({
            name: workshopName || `${name}'s Workshop`,
            ownerName: name,
            email: email,
            phone: workshopPhone || phone,
            address: workshopAddress || address,
            createdBy: null // Will update after user creation
        });
        await workshop.save();

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // ✅ CREATE USER WITH WORKSHOP ID
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            phone,
            address,
            answer,
            role: 1, // Owner = Admin
            workshopId: workshop._id,  // ✅ ADD THIS
            isVerified: true
        });

        // ✅ UPDATE WORKSHOP WITH CREATOR
        workshop.createdBy = user._id;
        await workshop.save();

        // Send response
        res.status(201).json({
            success: true,
            message: "Workshop and account created successfully",
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                workshopId: user.workshopId  // ✅ ADD THIS
            },
            workshop: {
                _id: workshop._id,
                name: workshop.name
            },
            token: generateToken(user._id, user.email, user.name, user.workshopId, user.role),
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============ LOGIN USER ============
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check for admin login
        if (email === process.env.adminEmail && password === process.env.adminPassword) {
            const admin = {
                _id: "admin",
                name: "Super Admin",
                email: process.env.adminEmail,
                role: 1,
                workshopId: null
            };
            return res.status(200).json({
                success: true,
                message: "Admin Login successful",
                user: admin,
                token: generateToken(admin._id, admin.email, admin.name, null, 1),
            });
        }

        
        const user = await User.findOne({ email  });
       
        if (!user) {
            // console.log("User not found");
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

       
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }


        // ✅ Get workshop info
        const workshop = await Workshop.findById(user.workshopId);

        // Send response
        return res.status(200).json({
            success: true,
            message: "Login successful",
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                workshopId: user.workshopId,     // ✅ ADD THIS
                workshopName: workshop?.name || 'N/A'  // ✅ ADD THIS
            },
            token: generateToken(user._id, user.email, user.name, user.workshopId, user.role, user.tokenVersion),
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============ GET CURRENT USER ============
const getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password -answer");
        // console.log("Current user fetched:", user);
        if (!user && req.user.email !== process.env.adminEmail) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // ✅ Get workshop info
        let workshop = null;
        if (user && user.workshopId) {
            workshop = await Workshop.findById(user.workshopId);
        }

        res.status(200).json({
            success: true,
            user: {
                _id: user?._id,
                name: user?.name || req.user.name,
                email: user?.email || req.user.email,
                phone: user?.phone || '',
                address: user?.address || '',
                role: user?.role || 1,
                workshopId: user?.workshopId || null,
                workshopName: workshop?.name || 'N/A',
                createdAt: user?.createdAt || null,
                updatedAt: user?.updatedAt || null
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============ FORGOT PASSWORD ============
const forgotPassword = async (req, res) => {
    try {
        const { email, answer, newPassword } = req.body;

        // Find user
        const user = await User.findOne({ email, answer });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Invalid email or security answer",
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password
        user.password = hashedPassword;
        await user.save();

        res.status(200).json({
            success: true,
            message: "Password updated successfully",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============ CHECK EMAIL EXISTS ============
const checkEmail = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        // console.log("Checking email:", email, "Found user:", user);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "No account found with this email"
            });
        }

        res.status(200).json({
            success: true,
            message: "Email verified"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============ VERIFY ANSWER ============
const verifyAnswer = async (req, res) => {
    try {
        const { email, answer } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (user.answer !== answer) {
            return res.status(400).json({
                success: false,
                message: "Incorrect security answer"
            });
        }

        res.status(200).json({
            success: true,
            message: "Answer verified"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============ UPDATE PROFILE ============
const updateProfile = async (req, res) => {
    try {
        const { name, email, phone, address } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Update fields
        user.name = name || user.name;
        user.email = email || user.email;
        user.phone = phone || user.phone;
        user.address = address || user.address;

        await user.save();

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                address: user.address,
                role: user.role,
                workshopId: user.workshopId,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============ UPDATE PASSWORD ============
const updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Check current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Current password is incorrect"
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.status(200).json({
            success: true,
            message: "Password updated successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};



// ============ FORCE LOGOUT USER ============
const forceLogout = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // ✅ Increment tokenVersion → all existing tokens become invalid
        user.tokenVersion = (user.tokenVersion || 0) + 1;
        await user.save();

        res.status(200).json({
            success: true,
            message: "User force logged out from all devices"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    registerUser,
    loginUser,
    getCurrentUser,
    forgotPassword,
    updateProfile,
    updatePassword,
    checkEmail,
    verifyAnswer,
    forceLogout
};