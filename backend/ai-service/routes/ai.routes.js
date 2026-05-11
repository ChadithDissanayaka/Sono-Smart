const express = require('express');

const router = express.Router();

const {
  generateWithClaude,
  generateWithGPT
} = require('../controllers/aiController');

// Routes
router.post('/claude', generateWithClaude);
router.post('/gpt', generateWithGPT);

module.exports = router;