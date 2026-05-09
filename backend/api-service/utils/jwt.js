const jwt = require('jsonwebtoken');

// Get JWT secret from environment variables or use a default for development
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRE = process.env.JWT_EXPIRE;

// Generate JWT token for a user
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRE
  });
};

// Verify JWT token
const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return { valid: true, expired: false, decoded };
  } catch (error) {
    return {
      valid: false,
      expired: error.name === 'TokenExpiredError',
      decoded: null
    };
  }
};

module.exports = {
  generateToken,
  verifyToken
};