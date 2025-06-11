const express = require('express');
const router = express.Router();
const { saveQuizResult, getQuizResults, getQuizResult } = require('../controllers/quizController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.post('/results', protect, saveQuizResult);
router.get('/results', protect, getQuizResults);
router.get('/results/:id', protect, getQuizResult);

module.exports = router;