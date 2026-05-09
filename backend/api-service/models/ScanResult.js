const mongoose = require('mongoose');

const ScanResultSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  scanSections: [
    {
      imageUrl: {
        type: String,
        required: [true, 'Image URL is required']
      },
      userPrediction: {
        type: String,
        required: [true, 'User prediction is required']
      },
      correctOrgan: {
        type: String,
        required: [true, 'Correct organ is required']
      },
      isCorrect: {
        type: Boolean,
        required: true
      }
    }
  ],
  totalScans: {
    type: Number,
    required: [true, 'Total number of scans is required']
  },
  correctScans: {
    type: Number,
    required: [true, 'Number of correct scans is required']
  },
  accuracy: {
    type: Number,
    required: [true, 'Accuracy percentage is required']
  },
  startTime: {
    type: Date,
    required: [true, 'Session start time is required']
  },
  endTime: {
    type: Date,
    required: [true, 'Session end time is required']
  },
  sessionDuration: {
    type: Number,
    required: [true, 'Session duration in seconds is required']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ScanResult', ScanResultSchema);