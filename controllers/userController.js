const User = require("../models/User");
const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");

// ─── GET /api/users/me ─────────────────────────────────────
// Fetch the current user's profile (excluding password)
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── PUT /api/users/me ─────────────────────────────────────
// Update the current user's profile (personal + academic + preferences)
exports.updateMe = async (req, res) => {
  try {
    // List of allowed fields that can be updated
    const allowedFields = [
      "firstName",
      "lastName",
      "username",
      "email",
      "mobile",
      "dob",
      "gender",
      "country",
      "bio",
      "college",
      "department",
      "year",
      "role",
      "goal",
      "preferences",
      "aiSummary",
      "flashcards",
      "documentChat",
      "newsletter",
    ];

    // Filter only allowed fields from request body
    const updates = {};
    for (let key of allowedFields) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    // Find user and update, return new document
    const user = await User.findByIdAndUpdate(
      req.userId,
      updates,
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── POST /api/users/change-password ──────────────────────
// Change user password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Current password is incorrect" });
    }

    // Hash new password (pre-save hook will handle it)
    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── POST /api/users/avatar ───────────────────────────────
// Upload profile picture (requires multer)
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    // Generate URL for the uploaded file
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    // Update user with new avatar URL
    const user = await User.findByIdAndUpdate(
      req.userId,
      { avatar: avatarUrl },
      { new: true }
    ).select("-password");

    res.json({ success: true, user, avatarUrl });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── DELETE /api/users/avatar ─────────────────────────────
// Remove profile picture
exports.removeAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // If there's an avatar, delete the file from server
    if (user.avatar) {
      const filePath = path.join(__dirname, "..", user.avatar);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Clear avatar URL in database
    user.avatar = "";
    await user.save();

    res.json({ success: true, message: "Avatar removed" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── PUT /api/users/preferences ───────────────────────────
// Update only preferences (can also be handled by updateMe)
exports.updatePreferences = async (req, res) => {
  try {
    const { preferences } = req.body;
    const user = await User.findByIdAndUpdate(
      req.userId,
      { preferences },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── POST /api/users/logout-all ───────────────────────────
// (Optional – requires session/token invalidation logic)
// For JWT, you can clear all tokens or just return success
exports.logoutAll = async (req, res) => {
  try {
    // If you store tokens in DB, delete them here
    // For simple JWT, client just removes the token
    res.json({ success: true, message: "Logged out from all devices" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};