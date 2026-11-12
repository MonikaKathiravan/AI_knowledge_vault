const Note = require("../models/Note");

// ─── Create Note ───
exports.createNote = async (req, res) => {
  try {
    const { title, content, category, tags, favorite, pinned } = req.body;
    const note = new Note({
      userId: req.userId,
      title,
      content,
      category: category || "Uncategorized",
      tags: tags || [],
      favorite: favorite || false,
      pinned: pinned || false,
    });
    await note.save();
    res.status(201).json({ success: true, note });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Get All Notes ───
exports.getNotes = async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.userId, archived: false }).sort(
      { pinned: -1, updatedAt: -1 },
    );
    res.json({ success: true, notes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Get Single Note ───
exports.getNote = async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.userId });
    if (!note)
      return res
        .status(404)
        .json({ success: false, message: "Note not found" });
    res.json({ success: true, note });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Update Note ───
exports.updateNote = async (req, res) => {
  try {
    const { title, content, category, tags, favorite, pinned, archived } =
      req.body;
    const note = await Note.findOne({ _id: req.params.id, userId: req.userId });
    if (!note)
      return res
        .status(404)
        .json({ success: false, message: "Note not found" });

    if (title !== undefined) note.title = title;
    if (content !== undefined) note.content = content;
    if (category !== undefined) note.category = category;
    if (tags !== undefined) note.tags = tags;
    if (typeof favorite === "boolean") note.favorite = favorite;
    if (typeof pinned === "boolean") note.pinned = pinned;
    if (typeof archived === "boolean") note.archived = archived;
    note.updatedAt = new Date();

    await note.save();
    res.json({ success: true, note });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Delete Note ───
exports.deleteNote = async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!note)
      return res
        .status(404)
        .json({ success: false, message: "Note not found" });
    res.json({ success: true, message: "Note deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Search Notes ───
exports.searchNotes = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json({ success: true, notes: [] });
    const notes = await Note.find({
      userId: req.userId,
      archived: false,
      $or: [
        { title: { $regex: q, $options: "i" } },
        { content: { $regex: q, $options: "i" } },
        { tags: { $regex: q, $options: "i" } },
        { category: { $regex: q, $options: "i" } },
      ],
    }).sort({ pinned: -1, updatedAt: -1 });
    res.json({ success: true, notes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Toggle Favorite ───
exports.toggleFavorite = async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.userId });
    if (!note)
      return res
        .status(404)
        .json({ success: false, message: "Note not found" });
    note.favorite = !note.favorite;
    await note.save();
    res.json({ success: true, note });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Toggle Pin ───
exports.togglePin = async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.userId });
    if (!note)
      return res
        .status(404)
        .json({ success: false, message: "Note not found" });
    note.pinned = !note.pinned;
    await note.save();
    res.json({ success: true, note });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
