const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const goalController = require('../controllers/goalController');

router.use(auth);
router.get('/', goalController.getGoals);
router.get('/analytics', goalController.getAnalytics);
router.get('/recommendations', goalController.getRecommendations);
router.post('/', goalController.createGoal);
router.get('/:id', goalController.getGoal);
router.put('/:id', goalController.updateGoal);
router.delete('/:id', goalController.deleteGoal);
router.post('/:id/task', goalController.toggleTask);
router.post('/:id/milestone', goalController.toggleMilestone);

module.exports = router;