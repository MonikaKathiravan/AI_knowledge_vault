const Conversation = require('../models/Conversation');
const Document = require('../models/Document');
const extractText = require('../utils/textExtractor');
const { chatWithDocument } = require('../services/geminiService');

// ─── Create new conversation ───
exports.createConversation = async (req, res) => {
  try {
    const { documentId, title } = req.body;
    const doc = await Document.findOne({ _id: documentId, userId: req.userId });
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });

    const conversation = new Conversation({
      userId: req.userId,
      documentId,
      title: title || 'New Chat',
      messages: [],
    });
    await conversation.save();
    res.status(201).json({ success: true, conversation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Send message ───
exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, message } = req.body;
    const conversation = await Conversation.findOne({ _id: conversationId, userId: req.userId });
    if (!conversation) return res.status(404).json({ success: false, message: 'Conversation not found' });

    // Get document text
    const doc = await Document.findOne({ _id: conversation.documentId, userId: req.userId });
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });
    const text = await extractText(doc.filePath, doc.fileType);
    if (!text) return res.status(400).json({ success: false, message: 'Could not extract text from document' });

    // Add user message
    conversation.messages.push({ role: 'user', content: message });
    conversation.updatedAt = new Date();

    // Generate AI response
    const history = conversation.messages.slice(-5); // last 5 messages for context
    const aiResponse = await chatWithDocument(text, message, history);

    // Add AI message
    conversation.messages.push({ role: 'assistant', content: aiResponse });
    await conversation.save();

    res.json({ success: true, message: { role: 'assistant', content: aiResponse } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Get all conversations for user ───
exports.getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({ userId: req.userId })
      .populate('documentId', 'displayName')
      .sort({ updatedAt: -1 });
    res.json({ success: true, conversations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Get single conversation with messages ───
exports.getConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findOne({ _id: req.params.id, userId: req.userId })
      .populate('documentId', 'displayName');
    if (!conversation) return res.status(404).json({ success: false, message: 'Conversation not found' });
    res.json({ success: true, conversation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Delete conversation ───
exports.deleteConversation = async (req, res) => {
  try {
    const result = await Conversation.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!result) return res.status(404).json({ success: false, message: 'Conversation not found' });
    res.json({ success: true, message: 'Conversation deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};