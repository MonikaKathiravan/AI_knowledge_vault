const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const UserSchema = new mongoose.Schema({
  // ─── Personal Information ──────────────────────────────
  firstName: {
    type: String,
    required: [true, "First name is required"],
    trim: true,
  },
  lastName: {
    type: String,
    required: [true, "Last name is required"],
    trim: true,
  },
  username: {
    type: String,
    required: [true, "Username is required"],
    unique: true,
    trim: true,
    minlength: [3, "Username must be at least 3 characters"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
  },
  mobile: {
    type: String,
    required: [true, "Mobile number is required"],
    unique: true,
    trim: true,
    match: [/^[0-9]{10}$/, "Mobile number must be exactly 10 digits"],
  },
  // ─── Extended Profile Fields (NEW) ─────────────────────
  dob: {
    type: Date,
    default: null,
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other', ''],
    default: '',
  },
  country: {
    type: String,
    default: '',
  },
  bio: {
    type: String,
    default: '',
  },
  avatar: {
    type: String, // URL to uploaded image
    default: '',
  },

  // ─── Academic & Role Information ──────────────────────
  college: {
    type: String,
    required: [true, "College name is required"],
    trim: true,
  },
  department: {
    type: String,
    required: [true, "Department is required"],
    trim: true,
  },
  year: {
    type: String,
    required: [true, "Year of study is required"],
    enum: ["1st Year", "2nd Year", "3rd Year", "4th Year"],
  },
  role: {
    type: String,
    enum: ["Student", "Faculty", "Research Scholar"],
    default: "Student",
  },
  goal: {
    type: String,
    enum: [
      "Exam Preparation",
      "Competitive Programming",
      "Research Work",
      "Daily Note Management",
      "Interview Preparation",
    ],
  },

  // ─── User Preferences (NEW) ────────────────────────────
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system',
    },
    language: {
      type: String,
      default: 'en',
    },
    emailNotifications: {
      type: Boolean,
      default: true,
    },
    pushNotifications: {
      type: Boolean,
      default: true,
    },
    reminderNotifications: {
      type: Boolean,
      default: true,
    },
    aiSuggestions: {
      type: Boolean,
      default: true,
    },
    autoSummary: {
      type: Boolean,
      default: false,
    },
    smartRecommendations: {
      type: Boolean,
      default: true,
    },
  },

  // ─── Security & Authentication ──────────────────────────
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [8, "Password must be at least 8 characters"],
  },

  // ─── Study & Gamification Data ──────────────────────────
  streak: {
    type: Number,
    default: 0,
  },
  lastStudyDate: {
    type: Date,
    default: null,
  },

  // ─── AI Feature Toggles ────────────────────────────────
  aiSummary: {
    type: Boolean,
    default: true,
  },
  flashcards: {
    type: Boolean,
    default: true,
  },
  documentChat: {
    type: Boolean,
    default: false,
  },
  newsletter: {
    type: Boolean,
    default: true,
  },

  // ─── Timestamps ──────────────────────────────────────────
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// ─── Pre‑save hook: hash password if modified ──────────────
UserSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// ─── Method to compare passwords (for login) ──────────────
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", UserSchema);