const express = require('express');
const router = express.Router();
const { getUserProfile, updateUserProfile, deleteUser, searchUsers } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const GameModel = require('../models/gameModel');

// all profile routes are protected (require JWT)

router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.delete('/profile', protect, deleteUser);

router.get('/search', protect, searchUsers);

router.get('/stats/:username', protect, async (req, res) => {
  try {
    const stats = await GameModel.getUserStats(req.params.username);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: "Error retrieving statistics" });
  }
});

module.exports = router;