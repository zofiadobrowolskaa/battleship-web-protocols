const express = require('express');
const router = express.Router();
const { getUserProfile, updateUserProfile, deleteUser, searchUsers } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// all profile routes are protected (require JWT)

// GET /api/users/profile
router.get('/profile', protect, getUserProfile);

// PUT /api/users/profile
router.put('/profile', protect, updateUserProfile);

// DELETE /api/users/profile
router.delete('/profile', protect, deleteUser);

// GET /api/users/search?query=abc
router.get('/search', protect, searchUsers);

module.exports = router;