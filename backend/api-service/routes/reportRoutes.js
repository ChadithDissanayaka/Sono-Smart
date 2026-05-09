const express = require('express');
const router = express.Router();
const { savePatientReport, getPatientReports, getPatientReport, updatePatientReport, deletePatientReport } = require('../controllers/patientReportController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.post('/', protect, savePatientReport);
router.get('/', protect, getPatientReports);
router.get('/:id', protect, getPatientReport);
router.put('/:id', protect, updatePatientReport);
router.delete('/:id', protect, deletePatientReport);

module.exports = router;