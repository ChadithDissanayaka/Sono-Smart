const QuizResult = require('../models/QuizResult');
const User = require('../models/User');

// @desc    Save quiz result
// @route   POST /api/quiz/results
// @access  Private
const saveQuizResult = async (req, res) => {
  try {
    const { correctAnswers, totalQuestions, timeSpent, answers, startTime, endTime, sessionDuration } = req.body;

    // Calculate accuracy
    const accuracy = (correctAnswers / totalQuestions) * 100;

    // Create quiz result
    const quizResult = await QuizResult.create({
      user: req.user.id,
      correctAnswers,
      totalQuestions,
      accuracy,
      timeSpent,
      startTime,
      endTime,
      sessionDuration,
      answers
    });

    res.status(201).json({
      success: true,
      data: quizResult
    });
  } catch (error) {
    console.error('Error saving quiz result:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while saving quiz result',
      error: error.message
    });
  }
};

// @desc    Get all quiz results for a user
// @route   GET /api/quiz/results
// @access  Private
const getQuizResults = async (req, res) => {
  try {
    const quizResults = await QuizResult.find({ user: req.user.id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: quizResults.length,
      data: quizResults
    });
  } catch (error) {
    console.error('Error fetching quiz results:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching quiz results',
      error: error.message
    });
  }
};

// @desc    Get single quiz result
// @route   GET /api/quiz/results/:id
// @access  Private
const getQuizResult = async (req, res) => {
  try {
    const quizResult = await QuizResult.findById(req.params.id);

    if (!quizResult) {
      return res.status(404).json({
        success: false,
        message: 'Quiz result not found'
      });
    }

    // Make sure user owns the quiz result
    if (quizResult.user.toString() !== req.user.id && req.user.role !== 'professional') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this quiz result'
      });
    }

    res.status(200).json({
      success: true,
      data: quizResult
    });
  } catch (error) {
    console.error('Error fetching quiz result:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching quiz result',
      error: error.message
    });
  }
};

module.exports = {
  saveQuizResult,
  getQuizResults,
  getQuizResult
};