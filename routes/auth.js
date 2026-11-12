const express = require("express");
const router = express.Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");

// =============================================
// POST /api/auth/register
// =============================================
router.post("/register", async (req, res) => {
  try {
    console.log("📥 Received registration request from frontend");
    console.log("📦 Request body:", req.body);

    const {
      firstName,
      lastName,
      username,
      email,
      mobile,
      college,
      department,
      year,
      role,
      goal,
      password,
      aiSummary,
      flashcards,
      documentChat,
      newsletter,
    } = req.body;

    console.log("👤 Extracted user data:", {
      firstName,
      lastName,
      email,
      username,
    });

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }, { mobile }],
    });

    if (existingUser) {
      console.log("⚠️ User already exists:", existingUser.email);
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    console.log("✅ No existing user found, creating new user...");

    // Create new user
    const user = new User({
      firstName,
      lastName,
      username,
      email,
      mobile,
      college,
      department,
      year,
      role: role || "Student",
      goal: goal || "",
      password,
      aiSummary: aiSummary !== undefined ? aiSummary : true,
      flashcards: flashcards !== undefined ? flashcards : true,
      documentChat: documentChat !== undefined ? documentChat : false,
      newsletter: newsletter !== undefined ? newsletter : true,
    });

    console.log("📦 User object created, saving to database...");

    await user.save();

    console.log("✅ User saved successfully! ID:", user._id);
    console.log("📊 Total users in DB:", await User.countDocuments());

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    console.log("🔑 JWT token generated");

    // ✅ Return ALL user fields
    res.status(201).json({
      success: true,
      message: "User registered successfully!",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        mobile: user.mobile,
        college: user.college,
        department: user.department,
        year: user.year,
        role: user.role,
        goal: user.goal,
        aiSummary: user.aiSummary,
        flashcards: user.flashcards,
        documentChat: user.documentChat,
        newsletter: user.newsletter,
        createdAt: user.createdAt,
      },
    });

    console.log("📤 Success response sent to frontend");
  } catch (error) {
    console.error("❌ Registration error details:", error);
    console.error("❌ Error name:", error.name);
    console.error("❌ Error message:", error.message);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      console.error("📋 Validation errors:", errors);
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Server error. Please try again later.",
    });
  }
});

// =============================================
// POST /api/auth/login
// =============================================
router.post("/login", async (req, res) => {
  try {
    console.log("📥 Login request for:", req.body.email);

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      console.log("⚠️ User not found:", email);
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log("⚠️ Password mismatch for:", email);
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    console.log("✅ Login successful for:", email);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    // ✅ Return ALL user fields
    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        mobile: user.mobile,
        college: user.college,
        department: user.department,
        year: user.year,
        role: user.role,
        goal: user.goal,
        aiSummary: user.aiSummary,
        flashcards: user.flashcards,
        documentChat: user.documentChat,
        newsletter: user.newsletter,
        createdAt: user.createdAt,
      },
    });

    console.log("📤 User data sent to frontend");
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
});

module.exports = router;
