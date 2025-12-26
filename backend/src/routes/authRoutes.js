const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');

// endpoint: POST /api/auth/register
router.post('/register', register);

// endpoint POST /api/auth/login
router.post('/login', login);

module.exports = router;