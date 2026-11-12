const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const flashcardController = require('../controllers/flashcardController');

router.use(auth);

// Generation
router.post('/generate/document', flashcardController.generateFromDocument);
router.post('/generate/note', flashcardController.generateFromNote);
router.post('/generate/summary', flashcardController.generateFromSummary);

// CRUD
router.get('/', flashcardController.getFlashcards);
router.get('/stats', flashcardController.getStats);
router.get('/export', flashcardController.exportFlashcards);
router.post('/import', flashcardController.importFlashcards);
router.get('/:id', flashcardController.getFlashcard);
router.put('/:id', flashcardController.updateFlashcard);
router.delete('/:id', flashcardController.deleteFlashcard);
router.delete('/', flashcardController.deleteAll);

module.exports = router;