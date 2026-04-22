const express = require('express');
const { register, login, verifyLoginMFA, getMe } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const loginRateLimiter = require('../middleware/loginRateLimiter');

const router = express.Router();

router.post('/register', register);
router.post('/login', loginRateLimiter, login);
router.post('/login/mfa', verifyLoginMFA);
router.get('/me', authMiddleware, getMe);

module.exports = router;