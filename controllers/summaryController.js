const Summary = require("../models/Summary");
const Document = require("../models/Document");
const Note = require("../models/Note"); // if you have notes model
const extractText = require("../utils/textExtractor");
const { generateSummary } = require("../services/geminiService");

// Helper: calculate reading time (200 wpm)
const calculateReadingTime = (wordCount) => Math.ceil(wordCount / 200);

// ─── Generate Summary ───
exports.generateSummary = async (req, res) => {
  try {
    const { documentId, type = "medium" } = req.body;
    const userId = req.userId;

    const doc = await Document.findOne({ _id: documentId, userId });
    if (!doc) {
      return res
        .status(404)
        .json({ success: false, message: "Document not found" });
    }

    const existing = await Summary.findOne({ documentId, userId });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Summary already exists. Use regenerate to update.",
      });
    }

    const text = await extractText(doc.filePath, doc.fileType);
    if (!text) {
      return res.status(400).json({
        success: false,
        message: "Could not extract text from this file type.",
      });
    }

    const result = await generateSummary(text, type);

    const originalReadingTime = calculateReadingTime(result.originalWordCount);
    const summaryReadingTime = calculateReadingTime(result.summaryWordCount);
    const compressionRatio =
      result.originalWordCount > 0
        ? 1 - result.summaryWordCount / result.originalWordCount
        : 0;

    const newSummary = new Summary({
      userId,
      documentId,
      summaryTitle: doc.displayName + " - Summary",
      summaryType: type,
      summaryText: result.summary,
      keyPoints: result.keyPoints,
      keywords: result.keywords,
      originalWordCount: result.originalWordCount,
      summaryWordCount: result.summaryWordCount,
      readingTimeMinutes: summaryReadingTime,
      compressionRatio,
      sourceType: "document",
    });
    await newSummary.save();

    const summaryWithDoc = await Summary.findById(newSummary._id).populate(
      "documentId",
      "displayName",
    );

    res.status(201).json({
      success: true,
      message: "Summary generated successfully",
      summary: summaryWithDoc,
      statistics: {
        originalWords: result.originalWordCount,
        summaryWords: result.summaryWordCount,
        compression: (compressionRatio * 100).toFixed(0) + "%",
        originalReadingTime: originalReadingTime + " min",
        summaryReadingTime: summaryReadingTime + " min",
        timeSaved: originalReadingTime - summaryReadingTime + " min",
      },
    });
  } catch (error) {
    console.error("Summary generation error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Regenerate Summary ───
exports.regenerateSummary = async (req, res) => {
  try {
    const { documentId, type = "medium" } = req.body;
    const userId = req.userId;

    const doc = await Document.findOne({ _id: documentId, userId });
    if (!doc) {
      return res
        .status(404)
        .json({ success: false, message: "Document not found" });
    }

    let summary = await Summary.findOne({ documentId, userId });
    if (!summary) {
      return exports.generateSummary(req, res);
    }

    const text = await extractText(doc.filePath, doc.fileType);
    if (!text) {
      return res
        .status(400)
        .json({ success: false, message: "Could not extract text" });
    }

    const result = await generateSummary(text, type);

    summary.summaryText = result.summary;
    summary.keyPoints = result.keyPoints;
    summary.keywords = result.keywords;
    summary.summaryType = type;
    summary.originalWordCount = result.originalWordCount;
    summary.summaryWordCount = result.summaryWordCount;
    summary.readingTimeMinutes = calculateReadingTime(result.summaryWordCount);
    summary.compressionRatio =
      result.originalWordCount > 0
        ? 1 - result.summaryWordCount / result.originalWordCount
        : 0;
    summary.updatedAt = new Date();

    await summary.save();

    const updatedSummary = await Summary.findById(summary._id).populate(
      "documentId",
      "displayName",
    );
    res.json({
      success: true,
      message: "Summary regenerated",
      summary: updatedSummary,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Get Summary by Document ID ───
exports.getSummary = async (req, res) => {
  try {
    const { documentId } = req.params;
    const userId = req.userId;

    const summary = await Summary.findOne({ documentId, userId })
      .populate("documentId", "displayName")
      .populate("noteId", "title");
    if (!summary) {
      return res
        .status(404)
        .json({
          success: false,
          message: "No summary found for this document",
        });
    }

    res.json({ success: true, summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Get Summary by ID (for single view) ───
exports.getSummaryById = async (req, res) => {
  try {
    const summary = await Summary.findOne({
      _id: req.params.id,
      userId: req.userId,
    })
      .populate("documentId", "displayName")
      .populate("noteId", "title");
    if (!summary) {
      return res
        .status(404)
        .json({ success: false, message: "Summary not found" });
    }
    res.json({ success: true, summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Get All Summaries for User ───
exports.getAllSummaries = async (req, res) => {
  try {
    const summaries = await Summary.find({ userId: req.userId })
      .populate("documentId", "displayName")
      .populate("noteId", "title")
      .sort({ createdAt: -1 });
    res.json({ success: true, summaries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Delete Summary by Document ID ───
exports.deleteSummary = async (req, res) => {
  try {
    const { documentId } = req.params;
    const userId = req.userId;

    const result = await Summary.findOneAndDelete({ documentId, userId });
    if (!result) {
      return res
        .status(404)
        .json({ success: false, message: "Summary not found" });
    }
    res.json({ success: true, message: "Summary deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Delete Summary by ID ───
exports.deleteSummaryById = async (req, res) => {
  try {
    const summary = await Summary.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!summary) {
      return res
        .status(404)
        .json({ success: false, message: "Summary not found" });
    }
    res.json({ success: true, message: "Summary deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Toggle Favorite ───
exports.toggleFavorite = async (req, res) => {
  try {
    const summary = await Summary.findOne({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!summary) {
      return res
        .status(404)
        .json({ success: false, message: "Summary not found" });
    }
    summary.isFavorite = !summary.isFavorite;
    await summary.save();
    res.json({ success: true, summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
