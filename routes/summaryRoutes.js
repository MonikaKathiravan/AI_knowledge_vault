const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const summaryController = require('../controllers/summaryController');

router.use(auth);

// Existing routes
router.post('/generate', summaryController.generateSummary);
router.post('/regenerate', summaryController.regenerateSummary);
router.get('/user', summaryController.getAllSummaries);
router.get('/:documentId', summaryController.getSummary);       // by documentId
router.delete('/:documentId', summaryController.deleteSummary); // by documentId

// New routes for summary ID operations
router.get('/summary/:id', summaryController.getSummaryById);
router.delete('/summary/:id', summaryController.deleteSummaryById);
router.put('/favorite/:id', summaryController.toggleFavorite);

module.exports = router;