const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const userController = require("../controllers/userController");
const multer = require("multer");
const path = require("path");

// ─── Multer setup for avatar upload ──────────────────────
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/avatars/"); // Make sure this folder exists
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "avatar-" + req.userId + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Only images are allowed (jpeg, jpg, png, gif)"));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
  fileFilter: fileFilter,
});

// ─── All routes require authentication ────────────────────
router.use(auth);

// ─── Profile routes ───────────────────────────────────────
router.get("/me", userController.getMe);
router.put("/me", userController.updateMe);

// ─── Avatar routes ────────────────────────────────────────
router.post("/avatar", upload.single("avatar"), userController.uploadAvatar);
router.delete("/avatar", userController.removeAvatar);

// ─── Password routes ──────────────────────────────────────
router.post("/change-password", userController.changePassword);

// ─── Preferences routes ──────────────────────────────────
router.put("/preferences", userController.updatePreferences);

// ─── Logout all devices ──────────────────────────────────
router.post("/logout-all", userController.logoutAll);

module.exports = router;