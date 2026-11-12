const mongoose = require('mongoose');

const FlashcardSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
  },
  noteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Note',
  },
  summaryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Summary',
  },
  question: {
    type: String,
    required: true,
  },
  answer: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    default: 'Uncategorized',
  },
  tags: {
    type: [String],
    default: [],
  },
  favorite: {
    type: Boolean,
    default: false,
  },
  difficult: {
    type: Boolean,
    default: false,
  },
  learned: {
    type: Boolean,
    default: false,
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

module.exports = mongoose.model('Flashcard', FlashcardSchema);