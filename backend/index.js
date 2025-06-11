const express = require('express');
const connectDB = require('./config/db');
const mongoose = require('mongoose');
const app = express();
const port = process.env.PORT || 3000;
const cors = require('cors');

// Import routes
const authRoutes = require('./routes/authRoutes');
const patientRoutes = require('./routes/patientRoutes');
const quizRoutes = require('./routes/quizRoutes');
const scanRoutes = require('./routes/scanRoutes');
const reportRoutes = require('./routes/reportRoutes');

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/reports', reportRoutes);

app.get('/api/health', async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;
    const dbStatus = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    }[dbState];

    await mongoose.connection.db.admin().ping();

    res.json({
      status: 'healthy',
      message: 'SonoSmart API is running',
      database: {
        status: dbStatus,
        connection: mongoose.connection.host
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Database connection error',
      error: error.message
    });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
