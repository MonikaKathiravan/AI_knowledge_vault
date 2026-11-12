const express = require("express");
const router = express.Router();
const Document = require("../models/Document");
const Goal = require("../models/Goal");
const upload = require("../config/multer");
const auth = require("../middleware/auth");
const fs = require("fs");
const jwt = require("jsonwebtoken");

// ─── Helper: extract userId from token (header or query) ───
const getUserIdFromToken = (req) => {
  let token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token && req.query.token) {
    token = req.query.token;
  }
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.userId;
  } catch {
    return null;
  }
};

// ─── Upload ───
router.post("/upload", auth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }
    const { displayName, category } = req.body;
    const newDoc = new Document({
      userId: req.userId,
      originalName: req.file.originalname,
      displayName: displayName || req.file.originalname,
      fileName: req.file.filename,
      fileType: req.file.originalname.split(".").pop().toLowerCase(),
      fileSize: req.file.size,
      category: category || "Uncategorized",
      filePath: req.file.path,
    });
    await newDoc.save();

    // ─── Auto‑increment document goals ──────────────
    await Goal.updateMany(
      {
        userId: req.userId,
        type: 'documents',
        status: { $in: ['pending', 'in-progress'] }
      },
      { $inc: { current: 1 } }
    );
    // ──────────────────────────────────────────────────

    res.status(201).json({ success: true, document: newDoc });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Upload failed" });
  }
});

// ─── Get all ───
router.get("/", auth, async (req, res) => {
  try {
    const docs = await Document.find({ userId: req.userId }).sort({
      uploadDate: -1,
    });
    res.json({ success: true, documents: docs });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch documents" });
  }
});

// ─── Get single ───
router.get("/:id", auth, async (req, res) => {
  try {
    const doc = await Document.findOne({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!doc)
      return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, document: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── Update (rename, favorite, category) ───
router.put("/:id", auth, async (req, res) => {
  try {
    const { displayName, category, isFavorite } = req.body;
    const doc = await Document.findOne({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!doc)
      return res.status(404).json({ success: false, message: "Not found" });
    if (displayName) doc.displayName = displayName;
    if (category) doc.category = category;
    if (typeof isFavorite === "boolean") doc.isFavorite = isFavorite;
    doc.updatedAt = new Date();
    await doc.save();
    res.json({ success: true, document: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: "Update failed" });
  }
});

// ─── Delete ───
router.delete("/:id", auth, async (req, res) => {
  try {
    const doc = await Document.findOne({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!doc)
      return res.status(404).json({ success: false, message: "Not found" });

    // Remove the physical file
    fs.unlink(doc.filePath, (err) => {
      if (err) console.error(err);
    });

    // Delete the document record
    await doc.deleteOne();

    // ─── Auto‑decrement document goals ──────────────
    await Goal.updateMany(
      {
        userId: req.userId,
        type: 'documents',
        status: { $in: ['pending', 'in-progress'] }
      },
      { $inc: { current: -1 } }
    );
    // ──────────────────────────────────────────────────

    res.json({ success: true, message: "Deleted" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ success: false, message: "Delete failed" });
  }
});

// ─── Download ───
router.get("/download/:id", async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Please authenticate" });
    }
    const doc = await Document.findOne({
      _id: req.params.id,
      userId: userId,
    });
    if (!doc)
      return res.status(404).json({ success: false, message: "Not found" });
    doc.downloads += 1;
    await doc.save();
    res.download(doc.filePath, doc.originalName);
  } catch (error) {
    res.status(500).json({ success: false, message: "Download failed" });
  }
});

// ─── View ───
router.get("/view/:id", async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Please authenticate" });
    }
    const doc = await Document.findOne({
      _id: req.params.id,
      userId: userId,
    });
    if (!doc)
      return res.status(404).json({ success: false, message: "Not found" });
    doc.lastOpened = new Date();
    await doc.save();
    res.sendFile(doc.filePath);
  } catch (error) {
    console.error("View error:", error);
    res.status(500).json({ success: false, message: "View failed" });
  }
});

module.exports = router;