const Flashcard = require('../models/Flashcard');
const Document = require('../models/Document');
const Note = require('../models/Note');
const Summary = require('../models/Summary');
const extractText = require('../utils/textExtractor');
const { generateFlashcards } = require('../services/geminiService'); // we'll add this


// ─── Helper: Generate flashcards from text ───
const generateFromText = async (text, title, sourceId, sourceType, userId) => {
  const flashcardsData = await generateFlashcards(text);
  const cards = flashcardsData.map((item) => ({
    userId,
    question: item.question,
    answer: item.answer,
    category: item.category || 'Uncategorized',
    tags: item.tags || [],
    [sourceType === 'document' ? 'documentId' : sourceType === 'note' ? 'noteId' : 'summaryId']: sourceId,
  }));
  return Flashcard.insertMany(cards);
};

// ─── Generate from Document ───
exports.generateFromDocument = async (req, res) => {
  try {
    const { documentId } = req.body;
    const userId = req.userId;
    const doc = await Document.findOne({ _id: documentId, userId });
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });

    const text = await extractText(doc.filePath, doc.fileType);
    if (!text) return res.status(400).json({ success: false, message: 'Could not extract text' });

    const cards = await generateFromText(text, doc.displayName, doc._id, 'document', userId);
    res.status(201).json({ success: true, message: `${cards.length} flashcards generated`, count: cards.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Generate from Note ───
exports.generateFromNote = async (req, res) => {
  try {
    const { noteId } = req.body;
    const userId = req.userId;
    const note = await Note.findOne({ _id: noteId, userId });
    if (!note) return res.status(404).json({ success: false, message: 'Note not found' });

    const text = note.content.replace(/<[^>]+>/g, '');
    const cards = await generateFromText(text, note.title, note._id, 'note', userId);
    res.status(201).json({ success: true, message: `${cards.length} flashcards generated`, count: cards.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Generate from Summary ───
exports.generateFromSummary = async (req, res) => {
  try {
    const { summaryId } = req.body;
    const userId = req.userId;
    const summary = await Summary.findOne({ _id: summaryId, userId });
    if (!summary) return res.status(404).json({ success: false, message: 'Summary not found' });

    const cards = await generateFromText(summary.summaryText, summary.summaryTitle, summary._id, 'summary', userId);
    res.status(201).json({ success: true, message: `${cards.length} flashcards generated`, count: cards.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Get all flashcards ───
exports.getFlashcards = async (req, res) => {
  try {
    const { category, tag, favorite, difficult, learned } = req.query;
    const filter = { userId: req.userId };
    if (category) filter.category = category;
    if (tag) filter.tags = { $in: [tag] };
    if (favorite === 'true') filter.favorite = true;
    if (difficult === 'true') filter.difficult = true;
    if (learned === 'true') filter.learned = true;
    const flashcards = await Flashcard.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, flashcards });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Get single ───
exports.getFlashcard = async (req, res) => {
  try {
    const flashcard = await Flashcard.findOne({ _id: req.params.id, userId: req.userId });
    if (!flashcard) return res.status(404).json({ success: false, message: 'Flashcard not found' });
    res.json({ success: true, flashcard });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Update (favorite, difficult, learned, question, answer, category, tags) ───
exports.updateFlashcard = async (req, res) => {
  try {
    const { question, answer, category, tags, favorite, difficult, learned } = req.body;
    const flashcard = await Flashcard.findOne({ _id: req.params.id, userId: req.userId });
    if (!flashcard) return res.status(404).json({ success: false, message: 'Flashcard not found' });

    if (question !== undefined) flashcard.question = question;
    if (answer !== undefined) flashcard.answer = answer;
    if (category !== undefined) flashcard.category = category;
    if (tags !== undefined) flashcard.tags = tags;
    if (typeof favorite === 'boolean') flashcard.favorite = favorite;
    if (typeof difficult === 'boolean') flashcard.difficult = difficult;
    if (typeof learned === 'boolean') flashcard.learned = learned;
    flashcard.updatedAt = new Date();
    await flashcard.save();
    res.json({ success: true, flashcard });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Delete ───
exports.deleteFlashcard = async (req, res) => {
  try {
    const flashcard = await Flashcard.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!flashcard) return res.status(404).json({ success: false, message: 'Flashcard not found' });
    res.json({ success: true, message: 'Flashcard deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Bulk delete ───
exports.deleteAll = async (req, res) => {
  try {
    await Flashcard.deleteMany({ userId: req.userId });
    res.json({ success: true, message: 'All flashcards deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Stats ───
exports.getStats = async (req, res) => {
  try {
    const userId = req.userId;
    const total = await Flashcard.countDocuments({ userId });
    const learned = await Flashcard.countDocuments({ userId, learned: true });
    const favorite = await Flashcard.countDocuments({ userId, favorite: true });
    const difficult = await Flashcard.countDocuments({ userId, difficult: true });
    res.json({ success: true, stats: { total, learned, favorite, difficult, remaining: total - learned } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Export as JSON ───
exports.exportFlashcards = async (req, res) => {
  try {
    const flashcards = await Flashcard.find({ userId: req.userId });
    res.json({ success: true, flashcards });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Import ───
exports.importFlashcards = async (req, res) => {
  try {
    const { flashcards } = req.body;
    if (!Array.isArray(flashcards)) return res.status(400).json({ success: false, message: 'Invalid data' });
    const cards = flashcards.map((f) => ({
      userId: req.userId,
      question: f.question,
      answer: f.answer,
      category: f.category || 'Uncategorized',
      tags: f.tags || [],
      favorite: f.favorite || false,
      difficult: f.difficult || false,
      learned: f.learned || false,
    }));
    const inserted = await Flashcard.insertMany(cards);
    res.status(201).json({ success: true, message: `${inserted.length} flashcards imported` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};