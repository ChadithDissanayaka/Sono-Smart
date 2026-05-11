const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/ai', require('./routes/ai.routes'));

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'ai-service'
  });
});

const PORT = process.env.PORT || 9000;

app.listen(PORT, () => {
  console.log(`ai-service running on port ${PORT}`);
});