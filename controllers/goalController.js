const Goal = require('../models/Goal');
const Document = require('../models/Document');    // 👈 import your models
const Note = require('../models/Note');
const Flashcard = require('../models/Flashcard');

// ─── Helper: get current count based on type ───
const getCurrentCount = async (userId, type) => {
  if (type === 'documents') {
    return await Document.countDocuments({ userId });
  }
  if (type === 'notes') {
    return await Note.countDocuments({ userId });
  }
  if (type === 'flashcards') {
    return await Flashcard.countDocuments({ userId });
  }
  return 0; // for 'custom' or 'study_time'
};

// ─── GET all goals ───
exports.getGoals = async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.userId, isActive: true });
    res.json({ success: true, goals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET analytics ───
exports.getAnalytics = async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.userId });
    const completed = goals.filter(g => g.status === 'completed').length;
    const total = goals.length;
    const progress = total ? (completed / total) * 100 : 0;
    // You can add streak logic here
    res.json({
      success: true,
      analytics: {
        streak: 0,
        progress,
        completed,
        upcomingCount: goals.filter(g => g.status === 'pending' || g.status === 'in-progress').length,
        taskCompletion: 0, // compute if needed
        total,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET recommendations ───
exports.getRecommendations = async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.userId });
    const recs = goals
      .filter(g => g.status !== 'completed')
      .map(g => `📌 "${g.title}" is ${g.status.replace('-', ' ')} – focus on it!`);
    if (recs.length === 0) recs.push('All your goals are on track! Keep it up.');
    res.json({ success: true, recommendations: recs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET single goal ───
exports.getGoal = async (req, res) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, userId: req.userId });
    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });
    res.json({ success: true, goal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── CREATE goal ───
exports.createGoal = async (req, res) => {
  try {
    const { title, description, category, priority, deadline, targetProgress, tasks, milestones, type } = req.body;

    // 🟢 Auto‑set current based on type
    const current = await getCurrentCount(req.userId, type);

    const goal = new Goal({
      userId: req.userId,
      title,
      description,
      category,
      priority,
      deadline,
      targetProgress: targetProgress || 100,
      tasks: tasks || [],
      milestones: milestones || [],
      type: type || 'custom',
      current,
      status: current >= (targetProgress || 100) ? 'completed' : 'in-progress',
    });

    await goal.save();
    res.status(201).json({ success: true, goal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── UPDATE goal ───
exports.updateGoal = async (req, res) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, userId: req.userId });
    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });

    const { title, description, category, priority, deadline, targetProgress, tasks, milestones, type } = req.body;

    // Update basic fields
    if (title) goal.title = title;
    if (description !== undefined) goal.description = description;
    if (category) goal.category = category;
    if (priority) goal.priority = priority;
    if (deadline) goal.deadline = deadline;
    if (targetProgress) goal.targetProgress = targetProgress;
    if (tasks) goal.tasks = tasks;
    if (milestones) goal.milestones = milestones;

    // 🟢 If type changes, recompute current from actual counts
    if (type && type !== goal.type) {
      goal.type = type;
      goal.current = await getCurrentCount(req.userId, type);
    } else if (type) {
      goal.type = type;
    }

    // For 'custom' you can allow manual override
    if (goal.type === 'custom' && req.body.current !== undefined) {
      goal.current = req.body.current;
    }

    // Auto‑update status
    goal.status = goal.current >= goal.targetProgress ? 'completed' : 'in-progress';
    goal.updatedAt = new Date();

    await goal.save();
    res.json({ success: true, goal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── DELETE goal ───
exports.deleteGoal = async (req, res) => {
  try {
    const result = await Goal.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!result) return res.status(404).json({ success: false, message: 'Goal not found' });
    res.json({ success: true, message: 'Goal deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Toggle Task ───
exports.toggleTask = async (req, res) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, userId: req.userId });
    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });
    const task = goal.tasks.id(req.body.taskId);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    task.completed = !task.completed;
    await goal.save();
    res.json({ success: true, goal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Toggle Milestone ───
exports.toggleMilestone = async (req, res) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, userId: req.userId });
    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });
    const milestone = goal.milestones.id(req.body.milestoneId);
    if (!milestone) return res.status(404).json({ success: false, message: 'Milestone not found' });
    milestone.completed = !milestone.completed;
    await goal.save();
    res.json({ success: true, goal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};