const ScanResult = require('../models/ScanResult');
const User = require('../models/User');
const { spawn } = require('child_process');
const path = require('path');

// @desc    Save scan result
// @route   POST /api/scan/results
// @access  Private
const saveScanResult = async (req, res) => {
  try {
    const { scanSections, totalScans, correctScans, startTime, endTime } = req.body;

    // Calculate accuracy
    const accuracy = (correctScans / totalScans) * 100;

    // Calculate session duration in seconds
    const startTimeDate = new Date(startTime);
    const endTimeDate = new Date(endTime);
    const sessionDuration = Math.round((endTimeDate - startTimeDate) / 1000);

    // Create scan result
    const scanResult = await ScanResult.create({
      user: req.user.id,
      scanSections,
      totalScans,
      correctScans,
      accuracy,
      startTime: startTimeDate,
      endTime: endTimeDate,
      sessionDuration
    });

    res.status(201).json({
      success: true,
      data: scanResult
    });
  } catch (error) {
    console.error('Error saving scan result:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while saving scan result',
      error: error.message
    });
  }
};

// @desc    Get all scan results for a user
// @route   GET /api/scan/results
// @access  Private
const getScanResults = async (req, res) => {
  try {
    const scanResults = await ScanResult.find({ user: req.user.id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: scanResults.length,
      data: scanResults
    });
  } catch (error) {
    console.error('Error fetching scan results:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching scan results',
      error: error.message
    });
  }
};

// @desc    Get single scan result
// @route   GET /api/scan/results/:id
// @access  Private
const getScanResult = async (req, res) => {
  try {
    const scanResult = await ScanResult.findById(req.params.id);

    if (!scanResult) {
      return res.status(404).json({
        success: false,
        message: 'Scan result not found'
      });
    }

    // Make sure user owns the scan result
    if (scanResult.user.toString() !== req.user.id && req.user.role !== 'professional') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this scan result'
      });
    }

    res.status(200).json({
      success: true,
      data: scanResult
    });
  } catch (error) {
    console.error('Error fetching scan result:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching scan result',
      error: error.message
    });
  }
};

// @desc    Detect organs in ultrasound image
// @route   POST /api/scan/detect-organs
// @access  Private
const detectOrgans = async (req, res) => {
  try {
    const { imageData } = req.body;

    if (!imageData) {
      return res.status(400).json({
        success: false,
        message: 'Image data is required'
      });
    }

    // Path to the Python script
    const scriptPath = path.join(__dirname, '..', 'utils', 'organDetection.py');

    // Spawn Python process
    const pythonProcess = spawn('python', [scriptPath]);

    let result = '';
    let errorOutput = '';

    // Collect data from script
    pythonProcess.stdout.on('data', (data) => {
      const output = data.toString();
      // Only add to result if the line starts with '{'
      if (output.trim().startsWith('{')) {
        result += output;
      }
    });

    // Collect error data
    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    // Handle process completion
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`Python process exited with code ${code}`);
        console.error(`Error output: ${errorOutput}`);
        return res.status(500).json({
          success: false,
          message: 'Error processing image',
          error: errorOutput
        });
      }

      try {
        // Parse the JSON result from the Python script
        console.log('Detection result:', result);
        const detectionResult = JSON.parse(result);

        res.status(200).json({
          success: true,
          data: detectionResult
        });
      } catch (parseError) {
        console.error('Error parsing Python script output:', parseError);
        res.status(500).json({
          success: false,
          message: 'Error parsing detection results',
          error: parseError.message
        });
      }
    });

    // Send the image data to the Python script
    pythonProcess.stdin.write(imageData);
    pythonProcess.stdin.end();

  } catch (error) {
    console.error('Error detecting organs:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while detecting organs',
      error: error.message
    });
  }
};

module.exports = {
  saveScanResult,
  getScanResults,
  getScanResult,
  detectOrgans
};