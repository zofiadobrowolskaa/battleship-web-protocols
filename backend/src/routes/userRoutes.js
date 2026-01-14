const express = require('express');
const router = express.Router();
const { getUserProfile, updateUserProfile, deleteUser, searchUsers } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const GameModel = require('../models/gameModel');

// all profile routes are protected (require JWT)

// GET /api/users/profile
router.get('/profile', protect, getUserProfile);

// PUT /api/users/profile
router.put('/profile', protect, updateUserProfile);

// DELETE /api/users/profile
router.delete('/profile', protect, deleteUser);

// GET /api/users/search?query=abc
router.get('/search', protect, searchUsers);

// GET /api/users/stats/:username
// fetches battle history summary for the dashboard
router.get('/stats/:username', protect, async (req, res) => {
  try {
    const stats = await GameModel.getUserStats(req.params.username);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: "Error retrieving statistics" });
  }
});

module.exports = router;