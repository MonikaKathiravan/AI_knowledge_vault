const mongoose = require("mongoose");

const DocumentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  originalName: {
    type: String,
    required: true,
  },
  displayName: {
    type: String,
    required: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  fileType: {
    type: String,
    required: true,
  },
  fileSize: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    default: "Uncategorized",
  },
  isFavorite: {
    type: Boolean,
    default: false,
  },
  filePath: {
    type: String,
    required: true,
  },
  uploadDate: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  downloads: {
    type: Number,
    default: 0,
  },
  lastOpened: {
    type: Date,
  },
});

module.exports = mongoose.model("Document", DocumentSchema);
