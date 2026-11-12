const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const favoriteController = require('../controllers/favoriteController');

router.use(auth);

router.get('/', favoriteController.getFavorites);
router.get('/check', favoriteController.checkFavorite);        // ✅ Added
router.get('/collections', favoriteController.getCollections);
router.get('/stats', favoriteController.getStats);
router.post('/', favoriteController.addFavorite);
router.delete('/:id', favoriteController.removeFavorite);
router.put('/:id', favoriteController.updateFavorite);
router.post('/bulk-delete', favoriteController.bulkDelete);


module.exports = router;