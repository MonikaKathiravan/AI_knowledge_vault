const mongoose = require('mongoose');

const FavoriteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  itemType: {
    type: String,
    enum: ['document', 'note', 'summary', 'flashcard', 'chat', 'search'],
    required: true,
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'itemType', // dynamic reference
  },
  isPinned: {
    type: Boolean,
    default: false,
  },
  collectionName: {
    type: String,
    default: 'Default',
  },
  colorLabel: {
    type: String,
    enum: ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'gray'],
    default: 'gray',
  },
  note: {
    type: String,
    default: '',
  },
  reminderDate: {
    type: Date,
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

module.exports = mongoose.model('Favorite', FavoriteSchema);