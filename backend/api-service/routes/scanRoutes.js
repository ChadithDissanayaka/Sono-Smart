const express = require('express');
const router = express.Router();
const { saveScanResult, getScanResults, getScanResult, detectOrgans } = require('../controllers/scanController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.post('/results', protect, saveScanResult);
router.get('/results', protect, getScanResults);
router.get('/results/:id', protect, getScanResult);
router.post('/detect-organs', protect, detectOrgans);

module.exports = router;