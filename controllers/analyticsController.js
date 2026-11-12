const Document = require('../models/Document');
const Note = require('../models/Note');
const Summary = require('../models/Summary');
const Flashcard = require('../models/Flashcard');
const Conversation = require('../models/Conversation');
const Favorite = require('../models/Favorite');

// Helper to get total counts
const getTotalCount = async (model, userId) => {
  return await model.countDocuments({ userId });
};

// Get document stats
const getDocumentStats = async (userId) => {
  const docs = await Document.find({ userId });
  const total = docs.length;
  const totalSize = docs.reduce((acc, doc) => acc + (doc.fileSize || 0), 0);
  const avgSize = total > 0 ? totalSize / total : 0;
  // views and downloads are not stored currently, we could add them but we'll skip for now
  return { total, totalSize, avgSize };
};

// Get note stats
const getNoteStats = async (userId) => {
  const notes = await Note.find({ userId });
  const total = notes.length;
  const pinned = notes.filter(n => n.pinned).length;
  const favorites = notes.filter(n => n.favorite).length;
  const totalWords = notes.reduce((acc, n) => {
    const plain = n.content.replace(/<[^>]+>/g, "");
    return acc + (plain.match(/\S+/g)?.length || 0);
  }, 0);
  const avgWords = total > 0 ? totalWords / total : 0;
  return { total, pinned, favorites, totalWords, avgWords };
};

// Get summary stats
const getSummaryStats = async (userId) => {
  const summaries = await Summary.find({ userId });
  const total = summaries.length;
  const totalWords = summaries.reduce((acc, s) => acc + (s.summaryWordCount || 0), 0);
  const avgLength = total > 0 ? totalWords / total : 0;
  // Time saved: assume original reading time = summaryWordCount * 2 (or some calculation)
  const timeSaved = total * 2; // placeholder
  return { total, totalWords, avgLength, timeSaved };
};

// Get flashcard stats
const getFlashcardStats = async (userId) => {
  const flashcards = await Flashcard.find({ userId });
  const total = flashcards.length;
  const learned = flashcards.filter(c => c.learned).length;
  const favorite = flashcards.filter(c => c.favorite).length;
  const remaining = total - learned;
  // Accuracy: we don't have quiz results, so we'll estimate based on learned vs total
  const accuracy = total > 0 ? Math.round((learned / total) * 100) : 0;
  return { total, learned, favorite, remaining, accuracy };
};

// Get chat stats
const getChatStats = async (userId) => {
  const conversations = await Conversation.find({ userId });
  const total = conversations.length;
  let totalMessages = 0;
  let totalQuestions = 0;
  let totalResponses = 0;
  conversations.forEach(conv => {
    const messages = conv.messages || [];
    totalMessages += messages.length;
    messages.forEach(msg => {
      if (msg.role === 'user') totalQuestions++;
      else if (msg.role === 'assistant') totalResponses++;
    });
  });
  // Average response time not stored, we'll skip
  const avgQuestionsPerChat = total > 0 ? Math.round(totalQuestions / total) : 0;
  return { total, totalMessages, totalQuestions, totalResponses, avgQuestionsPerChat };
};

// Get favorite stats
const getFavoriteStats = async (userId) => {
  const favorites = await Favorite.find({ userId });
  const total = favorites.length;
  const byType = {};
  favorites.forEach(fav => {
    byType[fav.itemType] = (byType[fav.itemType] || 0) + 1;
  });
  const pinned = favorites.filter(f => f.isPinned).length;
  return { total, byType, pinned };
};

// Get search stats (if we have search logs, we'd need a Search model; we'll simulate)
const getSearchStats = async (userId) => {
  // For now, we'll return placeholder
  return { total: 0, mostSearched: 'N/A' };
};

// Get knowledge growth (documents and notes over time)
const getKnowledgeGrowth = async (userId) => {
  // Group documents by date
  const docGrowth = await Document.aggregate([
    { $match: { userId } },
    { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$uploadDate" } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]);
  const noteGrowth = await Note.aggregate([
    { $match: { userId } },
    { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]);
  // Combine dates
  const allDates = new Set();
  docGrowth.forEach(d => allDates.add(d._id));
  noteGrowth.forEach(d => allDates.add(d._id));
  const sortedDates = Array.from(allDates).sort();
  const docCounts = sortedDates.map(date => {
    const found = docGrowth.find(d => d._id === date);
    return found ? found.count : 0;
  });
  const noteCounts = sortedDates.map(date => {
    const found = noteGrowth.find(d => d._id === date);
    return found ? found.count : 0;
  });
  return { labels: sortedDates, docCounts, noteCounts };
};

// Get most used topics (from categories of documents, notes, flashcards)
const getMostUsedTopics = async (userId) => {
  // Collect categories from documents, notes, flashcards
  const docCategories = await Document.distinct('category', { userId });
  const noteCategories = await Note.distinct('category', { userId });
  const flashcardCategories = await Flashcard.distinct('category', { userId });
  const allCategories = [...docCategories, ...noteCategories, ...flashcardCategories];
  const freq = {};
  allCategories.forEach(cat => {
    if (cat && cat !== 'Uncategorized') {
      freq[cat] = (freq[cat] || 0) + 1;
    }
  });
  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
  return sorted.map(([topic, count]) => ({ topic, count }));
};

// Main analytics function
exports.getAnalytics = async (req, res) => {
  try {
    const userId = req.userId;
    const [
      documentStats,
      noteStats,
      summaryStats,
      flashcardStats,
      chatStats,
      favoriteStats,
      searchStats,
      knowledgeGrowth,
      mostUsedTopics
    ] = await Promise.all([
      getDocumentStats(userId),
      getNoteStats(userId),
      getSummaryStats(userId),
      getFlashcardStats(userId),
      getChatStats(userId),
      getFavoriteStats(userId),
      getSearchStats(userId),
      getKnowledgeGrowth(userId),
      getMostUsedTopics(userId)
    ]);

    // Overall progress: based on flashcards learned
    const totalFlashcards = flashcardStats.total || 1;
    const progress = Math.min(Math.round((flashcardStats.learned / totalFlashcards) * 100), 100);

    // AI Usage: summarize usage of AI features
    const aiUsage = {
      summaries: summaryStats.total,
      flashcards: flashcardStats.total,
      chats: chatStats.total,
      searches: searchStats.total || 0,
    };

    // Study time (placeholders)
    const studyTime = {
      today: "2h 20m",
      week: "14h",
      month: "52h",
    };

    // Recent activity (combine latest from documents, notes, summaries, etc.)
    const recentDocs = await Document.find({ userId }).sort({ uploadDate: -1 }).limit(3);
    const recentNotes = await Note.find({ userId }).sort({ createdAt: -1 }).limit(3);
    const recentSummaries = await Summary.find({ userId }).sort({ createdAt: -1 }).limit(3);
    // Combine and sort by date
    const activities = [];
    recentDocs.forEach(doc => {
      activities.push({
        time: doc.uploadDate,
        text: `Uploaded document: ${doc.displayName}`,
        type: 'document',
        icon: '📄'
      });
    });
    recentNotes.forEach(note => {
      activities.push({
        time: note.createdAt,
        text: `Created note: ${note.title}`,
        type: 'note',
        icon: '📝'
      });
    });
    recentSummaries.forEach(sum => {
      activities.push({
        time: sum.createdAt,
        text: `Generated summary: ${sum.summaryTitle}`,
        type: 'summary',
        icon: '🧠'
      });
    });
    // Sort by time descending
    activities.sort((a, b) => new Date(b.time) - new Date(a.time));
    const recentActivity = activities.slice(0, 10);

    const analyticsData = {
      documentStats,
      noteStats,
      summaryStats,
      flashcardStats,
      chatStats,
      favoriteStats,
      searchStats,
      knowledgeGrowth,
      mostUsedTopics,
      progress,
      aiUsage,
      studyTime,
      recentActivity,
    };

    res.json({ success: true, data: analyticsData });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};