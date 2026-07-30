const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { 
    sendRegistrationRequestEmail,
    sendApprovalEmail,
    sendRejectionEmail 
} = require("../utils/sendEmail");

// Generate JWT Token
const generateToken = (id, email, name) => {
    return jwt.sign({ id, email: email, name: name }, process.env.JWT_SECRET, {
        expiresIn: "30d",
    });
};

// ============ REGISTER USER (With Admin Approval) ============
const registerUser = async (req, res) => {
    try {
        const { name, email, password, phone, address, answer } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User already exists with this email",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user with isVerified = false
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            phone,
            address,
            answer,
            isVerified: false, // ✅ Pending admin approval
        });

        // ✅ Send email to admin for approval
        await sendRegistrationRequestEmail({
            name,
            email,
            phone,
            address: typeof address === 'object' ? JSON.stringify(address) : address,
            role: 0 // Staff by default
        });

        // Send response
        res.status(201).json({
            success: true,
            message: "Registration submitted! Please wait for admin approval.",
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                isVerified: user.isVerified,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============ LOGIN USER (Check if verified) ============
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // ✅ Check for admin login first
        if (email === process.env.adminEmail && password === process.env.adminPassword) {
            const admin = {
                _id: "admin",
                name: "Nouman Admin",
                email: process.env.adminEmail,
                role: 1,
            };
            return res.status(200).json({
                success: true,
                message: "Admin Login successful",
                user: admin,
                token: generateToken(admin._id, admin.email, admin.name),
            });
        }

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        // ✅ Check if user is verified
        if (!user.isVerified) {
            return res.status(403).json({
                success: false,
                message: "Your account is pending admin approval. Please wait for verification email.",
            });
        }

        // Check password
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

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
                isVerified: user.isVerified,
            },
            token: generateToken(user._id, user.email, user.name),
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

        if (!user && req.user.email !== process.env.adminEmail) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        res.status(200).json({
            success: true,
            user: req.user.email == process.env.adminEmail ? req.user.name : user,
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

// ============ ADMIN: APPROVE USER ============
const approveUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (user.isVerified) {
            return res.status(400).json({
                success: false,
                message: "User is already verified"
            });
        }

        // Update user status
        user.isVerified = true;
        await user.save();

        // Send approval email to user
        await sendApprovalEmail(user.email, user.name);

        res.status(200).json({
            success: true,
            message: "User approved successfully. Email sent to user.",
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                isVerified: user.isVerified
            }
        });

    } catch (error) {
        console.error("Approve error:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============ ADMIN: REJECT USER ============
const rejectUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { reason } = req.body;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (user.isVerified) {
            return res.status(400).json({
                success: false,
                message: "User is already verified"
            });
        }

        // Save rejection reason and send email
        const rejectionReason = reason || "No reason provided";
        await sendRejectionEmail(user.email, user.name, rejectionReason);

        // Delete user from database
        await user.deleteOne();

        res.status(200).json({
            success: true,
            message: "User rejected and deleted. Email sent to user."
        });

    } catch (error) {
        console.error("Reject error:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============ ADMIN: GET ALL PENDING USERS ============
const getPendingUsers = async (req, res) => {
    try {
        const users = await User.find({
            isVerified: false,
            role: { $ne: 1 } // Exclude admins
        }).select("-password -answer");

        res.status(200).json({
            success: true,
            count: users.length,
            users: users
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============ ADMIN: GET ALL VERIFIED USERS ============
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({
            isVerified: true
        }).select("-password -answer");

        res.status(200).json({
            success: true,
            count: users.length,
            users: users
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
    approveUser,
    rejectUser,
    getPendingUsers,
    getAllUsers
};