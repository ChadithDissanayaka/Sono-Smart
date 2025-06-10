const mongoose = require('mongoose');

const QuizResultSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required'],
  },
  correctAnswers: {
    type: Number,
    required: [true, 'Number of correct answers is required']
  },
  totalQuestions: {
    type: Number,
    required: [true, 'Total number of questions is required']
  },
  accuracy: {
    type: Number,
    required: [true, 'Accuracy percentage is required']
  },
  timeSpent: {
    type: String,
    required: [true, 'Time spent is required']
  },
  startTime: {
    type: Date,
    required: [true, 'Quiz start time is required']
  },
  endTime: {
    type: Date,
    required: [true, 'Quiz end time is required']
  },
  sessionDuration: {
    type: Number,
    required: [true, 'Session duration is required']
  },
  answers: [
    {
      questionId: {
        type: Number,
        required: true
      },
      selectedAnswer: {
        type: Number,
        required: true
      },
      isCorrect: {
        type: Boolean,
        required: true
      }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('QuizResult', QuizResultSchema);