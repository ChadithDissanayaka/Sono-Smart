const mongoose = require('mongoose');

const PatientReportSchema = new mongoose.Schema({
  friendlyId: {
    type: String,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: [true, 'Patient ID is required']
  },
  scanImages: [
    {
      imageUrl: {
        type: String,
        required: [true, 'Image URL is required']
      },
      organ: {
        type: String,
        required: [true, 'Organ name is required']
      },
    }
  ],
  diagnosticName: {
    type: String,
    required: [true, 'Diagnostic name is required']
  },
  instructions: {
    type: String,
    default: ''
  },
  conditionDetails: {
    type: String,
    default: ''
  },
  additionalNotes: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('PatientReport', PatientReportSchema);