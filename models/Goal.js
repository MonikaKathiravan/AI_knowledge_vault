const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  text: { type: String, required: true },
  completed: { type: Boolean, default: false },
}, { _id: true });

const MilestoneSchema = new mongoose.Schema({
  title: { type: String, required: true },
  completed: { type: Boolean, default: false },
}, { _id: true });

const GoalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  category: {
    type: String,
    enum: ['Subject Learning', 'Interview Preparation', 'Coding Practice', 'Revision', 'Certification', 'Document Reading', 'Flashcard Practice', 'AI Learning Sessions'],
    default: 'Subject Learning',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  type: {
    type: String,
    enum: ['documents', 'notes', 'flashcards', 'study_time', 'custom'],
    default: 'custom',
  },
  current: {
    type: Number,
    default: 0,
    min: 0,
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  deadline: {
    type: Date,
    required: true,
  },
  targetProgress: {
    type: Number,
    default: 100,
    min: 1,
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'archived'],
    default: 'pending',
  },
  // 🔁 REMOVE the stored `progress` field – we'll compute it dynamically
  milestones: [MilestoneSchema],
  tasks: [TaskSchema],
  isActive: {
    type: Boolean,
    default: true,
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

// ✨ Virtual property: progress
GoalSchema.virtual('progress').get(function() {
  if (!this.targetProgress || this.targetProgress <= 0) return 0;
  const pct = (this.current / this.targetProgress) * 100;
  return Math.min(pct, 100);
});

// Ensure virtuals appear in JSON and Object output
GoalSchema.set('toJSON', { virtuals: true });
GoalSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Goal', GoalSchema);