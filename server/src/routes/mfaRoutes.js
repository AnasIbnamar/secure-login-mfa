const express = require('express');
const { setupMFA, verifyMFA } = require('../controllers/mfaController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/setup', authMiddleware, setupMFA);
router.post('/verify', authMiddleware, verifyMFA);

module.exports = router;