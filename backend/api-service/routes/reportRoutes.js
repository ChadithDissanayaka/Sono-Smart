const express = require('express');
const router = express.Router();
const {
  savePatientReport,
  getPatientReports,
  getPatientReport,
  updatePatientReport,
  deletePatientReport
} = require('../controllers/patientReportController');
const { generateWithClaude, generateWithGPT } = require('../controllers/reportAIController');
const { protect } = require('../middleware/auth');

router.post('/', protect, savePatientReport);
router.get('/', protect, getPatientReports);
router.get('/:id', protect, getPatientReport);
router.put('/:id', protect, updatePatientReport);
router.delete('/:id', protect, deletePatientReport);
router.post('/ai/claude', protect, generateWithClaude);
router.post('/ai/gpt', protect, generateWithGPT);

module.exports = router;
