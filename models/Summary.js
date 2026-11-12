const mongoose = require("mongoose");

const SummarySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Document",
  },
  noteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Note",
  },
  summaryTitle: {
    type: String,
    default: "AI Summary",
  },
  summaryType: {
    type: String,
    enum: [
      "short",
      "medium",
      "detailed",
      "bullet",
      "paragraph",
      "academic",
      "technical",
      "beginner",
    ],
    default: "medium",
  },
  summaryText: {
    type: String,
    required: true,
  },
  keyPoints: {
    type: [String],
    default: [],
  },
  keywords: {
    type: [String],
    default: [],
  },
  originalWordCount: {
    type: Number,
    default: 0,
  },
  summaryWordCount: {
    type: Number,
    default: 0,
  },
  readingTimeMinutes: {
    type: Number,
    default: 0,
  },
  compressionRatio: {
    type: Number,
    default: 0,
  },
  isFavorite: {
    type: Boolean,
    default: false,
  },
  sourceType: {
    type: String,
    enum: ["document", "note"],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Summary", SummarySchema);
