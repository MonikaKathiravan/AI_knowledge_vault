const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const noteController = require("../controllers/noteController");

router.use(auth);

router.post("/", noteController.createNote);
router.get("/", noteController.getNotes);
router.get("/search", noteController.searchNotes);
router.get("/:id", noteController.getNote);
router.put("/:id", noteController.updateNote);
router.delete("/:id", noteController.deleteNote);
router.put("/favorite/:id", noteController.toggleFavorite);
router.put("/pin/:id", noteController.togglePin);

module.exports = router;
