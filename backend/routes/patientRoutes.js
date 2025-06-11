const express = require('express');
const router = express.Router();
const {
  getPatients,
  getPatient,
  createPatient,
  updatePatient,
  deletePatient
} = require('../controllers/patientController');
const { protect } = require('../middleware/auth');

// All patient routes are protected
router.use(protect);

// Routes for /api/patients
router.route('/')
  .get(getPatients)
  .post(createPatient);

// Routes for /api/patients/:id
router.route('/:id')
  .get(getPatient)
  .put(updatePatient)
  .delete(deletePatient);

module.exports = router;