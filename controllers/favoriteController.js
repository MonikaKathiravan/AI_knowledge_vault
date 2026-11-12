const Favorite = require('../models/Favorite');
const Document = require('../models/Document');
const Note = require('../models/Note');
const Summary = require('../models/Summary');
const Flashcard = require('../models/Flashcard');
const Conversation = require('../models/Conversation');

// ─── Helper to get populated item ───
const getPopulatedItem = async (itemType, itemId) => {
  let item;
  switch (itemType) {
    case 'document':
      item = await Document.findById(itemId).select('displayName fileType fileSize uploadDate');
      break;
    case 'note':
      item = await Note.findById(itemId).select('title content category tags createdAt updatedAt');
      break;
    case 'summary':
      item = await Summary.findById(itemId).select('summaryTitle summaryText summaryType createdAt');
      break;
    case 'flashcard':
      item = await Flashcard.findById(itemId).select('question answer category tags createdAt');
      break;
    case 'chat':
      item = await Conversation.findById(itemId).select('title messages createdAt');
      break;
    default:
      return null;
  }
  return item;
};

// ─── Get all favorites for user ───
exports.getFavorites = async (req, res) => {
  try {
    const { collection, pinned, type } = req.query;
    const filter = { userId: req.userId };
    if (collection) filter.collectionName = collection;
    if (pinned === 'true') filter.isPinned = true;
    if (type) filter.itemType = type;

    const favorites = await Favorite.find(filter).sort({ isPinned: -1, createdAt: -1 });
    // Populate each item
    const populated = await Promise.all(favorites.map(async (fav) => {
      const item = await getPopulatedItem(fav.itemType, fav.itemId);
      return { ...fav.toObject(), item };
    }));
    res.json({ success: true, favorites: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Check if an item is favorited ───
exports.checkFavorite = async (req, res) => {
  try {
    const { itemType, itemId } = req.query;
    if (!itemType || !itemId) {
      return res.status(400).json({ success: false, message: 'itemType and itemId are required' });
    }
    const favorite = await Favorite.findOne({ userId: req.userId, itemType, itemId });
    res.json({ success: true, favorite });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Add favorite ───
exports.addFavorite = async (req, res) => {
  try {
    const { itemType, itemId, collectionName, colorLabel, note, reminderDate } = req.body;
    // Check if already exists
    const existing = await Favorite.findOne({ userId: req.userId, itemType, itemId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Already in favorites' });
    }
    const favorite = new Favorite({
      userId: req.userId,
      itemType,
      itemId,
      collectionName: collectionName || 'Default',
      colorLabel: colorLabel || 'gray',
      note: note || '',
      reminderDate: reminderDate || null,
    });
    await favorite.save();
    // Populate item
    const item = await getPopulatedItem(itemType, itemId);
    res.status(201).json({ success: true, favorite: { ...favorite.toObject(), item } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Remove favorite ───
exports.removeFavorite = async (req, res) => {
  try {
    const { id } = req.params;
    const favorite = await Favorite.findOneAndDelete({ _id: id, userId: req.userId });
    if (!favorite) {
      return res.status(404).json({ success: false, message: 'Favorite not found' });
    }
    res.json({ success: true, message: 'Removed from favorites' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Update favorite (pin, collection, note, reminder) ───
exports.updateFavorite = async (req, res) => {
  try {
    const { id } = req.params;
    const { isPinned, collectionName, colorLabel, note, reminderDate } = req.body;
    const favorite = await Favorite.findOne({ _id: id, userId: req.userId });
    if (!favorite) {
      return res.status(404).json({ success: false, message: 'Favorite not found' });
    }
    if (isPinned !== undefined) favorite.isPinned = isPinned;
    if (collectionName) favorite.collectionName = collectionName;
    if (colorLabel) favorite.colorLabel = colorLabel;
    if (note !== undefined) favorite.note = note;
    if (reminderDate) favorite.reminderDate = reminderDate;
    favorite.updatedAt = new Date();
    await favorite.save();
    const item = await getPopulatedItem(favorite.itemType, favorite.itemId);
    res.json({ success: true, favorite: { ...favorite.toObject(), item } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Bulk operations ───
exports.bulkDelete = async (req, res) => {
  try {
    const { ids } = req.body;
    await Favorite.deleteMany({ _id: { $in: ids }, userId: req.userId });
    res.json({ success: true, message: 'Favorites removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Get collections for user ───
exports.getCollections = async (req, res) => {
  try {
    const collections = await Favorite.distinct('collectionName', { userId: req.userId });
    res.json({ success: true, collections });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Get stats ───
exports.getStats = async (req, res) => {
  try {
    const total = await Favorite.countDocuments({ userId: req.userId });
    const byType = await Favorite.aggregate([
      { $match: { userId: req.userId } },
      { $group: { _id: '$itemType', count: { $sum: 1 } } }
    ]);
    const stats = { total };
    byType.forEach(t => { stats[t._id] = t.count; });
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};