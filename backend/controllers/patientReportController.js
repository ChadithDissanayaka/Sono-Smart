const PatientReport = require('../models/PatientReport');
const Patient = require('../models/Patient');

// Generate a friendly ID for patient reports in the format REP-YYYY-XXXX
const generateFriendlyId = async (patient) => {
  const currentYear = new Date().getFullYear();
  const prefix = `REP-${currentYear}-`;

  // Find the highest numbered report for this year
  const highestReport = await PatientReport.findOne({
    friendlyId: { $regex: `^${prefix}` }
  })
    .sort({ friendlyId: -1 });

  let nextNumber = 1;

  if (highestReport && highestReport.friendlyId) {
    // Extract the number part from the existing ID
    const currentNumber = parseInt(highestReport.friendlyId.slice(prefix.length), 10);
    nextNumber = currentNumber + 1;
  }

  const patientName = await Patient.findById(patient);
  if (!patientName) {
    throw new Error('Patient not found');
  }
  const patientFirstName = patientName.firstName;
  const patientLastName = patientName.lastName;
  const patientNameInitials = patientFirstName + patientLastName.charAt(0);

  // Format the number with leading zeros (4 digits)
  return `${prefix}${nextNumber.toString().padStart(4, '0')}-${patientNameInitials}`;
};

// @desc    Save patient report
// @route   POST /api/reports
// @access  Private
const savePatientReport = async (req, res) => {
  try {
    const { patient, scanImages, diagnosticName, instructions, conditionDetails, additionalNotes } = req.body;

    // Generate a friendly ID for the report
    const friendlyId = await generateFriendlyId(patient);

    // Create patient report
    const patientReport = await PatientReport.create({
      friendlyId,
      user: req.user.id,
      patient,
      scanImages,
      diagnosticName,
      instructions,
      conditionDetails,
      additionalNotes
    });

    res.status(201).json({
      success: true,
      data: patientReport
    });
  } catch (error) {
    console.error('Error saving patient report:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while saving patient report',
      error: error.message
    });
  }
};

// @desc    Get all patient reports for a user
// @route   GET /api/reports
// @access  Private
const getPatientReports = async (req, res) => {
  try {
    const patientReports = await PatientReport.find({ user: req.user.id })
      .populate('patient', 'firstName lastName dateOfBirth gender email phone address createdAt')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: patientReports.length,
      data: patientReports
    });
  } catch (error) {
    console.error('Error fetching patient reports:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching patient reports',
      error: error.message
    });
  }
};

// @desc    Get single patient report
// @route   GET /api/reports/:id
// @access  Private
const getPatientReport = async (req, res) => {
  try {
    const patientReport = await PatientReport.findById(req.params.id)
      .populate('patient', 'firstName lastName dateOfBirth gender email phone address createdAt');

    if (!patientReport) {
      return res.status(404).json({
        success: false,
        message: 'Patient report not found'
      });
    }

    // Make sure user owns the patient report
    if (patientReport.user.toString() !== req.user.id && req.user.role !== 'professional') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this patient report'
      });
    }

    res.status(200).json({
      success: true,
      data: patientReport
    });
  } catch (error) {
    console.error('Error fetching patient report:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching patient report',
      error: error.message
    });
  }
};

// @desc    Update patient report
// @route   PUT /api/reports/:id
// @access  Private
const updatePatientReport = async (req, res) => {
  try {
    let patientReport = await PatientReport.findById(req.params.id);

    if (!patientReport) {
      return res.status(404).json({
        success: false,
        message: 'Patient report not found'
      });
    }

    // Make sure user owns the patient report
    if (patientReport.user.toString() !== req.user.id && req.user.role !== 'professional') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to update this patient report'
      });
    }

    // Update patient report
    patientReport = await PatientReport.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('patient', 'firstName lastName dateOfBirth gender email phone address createdAt');

    res.status(200).json({
      success: true,
      data: patientReport
    });
  } catch (error) {
    console.error('Error updating patient report:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating patient report',
      error: error.message
    });
  }
};

// @desc    Delete patient report
// @route   DELETE /api/reports/:id
// @access  Private
const deletePatientReport = async (req, res) => {
  try {
    const patientReport = await PatientReport.findById(req.params.id);

    if (!patientReport) {
      return res.status(404).json({
        success: false,
        message: 'Patient report not found'
      });
    }

    // Make sure user owns the patient report
    if (patientReport.user.toString() !== req.user.id && req.user.role !== 'professional') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to delete this patient report'
      });
    }

    await patientReport.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting patient report:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting patient report',
      error: error.message
    });
  }
};

module.exports = {
  savePatientReport,
  getPatientReports,
  getPatientReport,
  updatePatientReport,
  deletePatientReport
};