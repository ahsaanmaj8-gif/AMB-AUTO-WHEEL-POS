const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Generate JWT Token
const generateToken = (id, email , name) => {
  return jwt.sign({ id, email: email, name: name }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

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

    // Create new user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      address,
      answer,
    });

    // Send response
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      token: generateToken(user._id, user.email , user.name),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

//     if (
//       email === process.env.adminEmail &&
//       password === process.env.adminPassword
//     ) {
        
//      const admin = {
//   _id: "admin",
//   name: "Nouman Admin",
//   email: process.env.adminEmail,
//   role: 1,
// };

// return res.status(200).json({
//   success: true,
//   message: "Admin Login successful",
//   user: admin,
//   token: generateToken(admin._id, admin.email),
// });
//     }

    // Find user by email
    const user = await User.findOne({ email });
    console.log("User found in DB backend:", user);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check password
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    console.log("Password match:", isPasswordMatch);
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
      },
      token: generateToken(user._id),
    });



    console.log("yaha arha k nhi")





     if (
      email === process.env.adminEmail &&
      password === process.env.adminPassword
    ) {
        
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
  token: generateToken(admin._id, admin.email),
});
    }

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password -answer");

    // console.log("Fetched user from DB:", user);
    if (!user && req.user.email !== process.env.adminEmail) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
 
    // console.log("Current user:", req.user);

    res.status(200).json({
      success: true,
      user: req.user.email==process.env.adminEmail?req.user.name :user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

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
// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
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
// @desc    Update user password
// @route   PUT /api/users/password
// @access  Private
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



module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
  forgotPassword,
  updateProfile,
  updatePassword,
  checkEmail,
  verifyAnswer
};
 