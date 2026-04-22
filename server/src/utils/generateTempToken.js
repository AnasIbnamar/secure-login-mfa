const jwt = require('jsonwebtoken');

const generateTempToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '5m',
  });
};

module.exports = generateTempToken;