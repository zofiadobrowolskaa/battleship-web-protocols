const db = require('../config/db');
const bcrypt = require('bcryptjs');

// READ Profile - get current user's profile
const getUserProfile = async (req, res) => {
  try {
    // query database for user by ID (from req.user set by auth middleware)
    const user = await db.query(
      'SELECT id, username, email, created_at FROM users WHERE id = $1',
      [req.user.userId]
    );

    // respond with user data (without password)
    res.json(user.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// UPDATE Profile - update username and/or email
const updateUserProfile = async (req, res) => {
  const { username, email } = req.body;
  try {
    // update username and email for the current user
    const updatedUser = await db.query(
      'UPDATE users SET username = $1, email = $2 WHERE id = $3 RETURNING id, username, email',
      [username, email, req.user.userId]
    );

    // respond with updated user data
    res.json({ message: 'Profile updated', user: updatedUser.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Update failed' });
  }
};

// DELETE User - remove user from database
const deleteUser = async (req, res) => {
  try {
    // delete user by ID
    await db.query('DELETE FROM users WHERE id = $1', [req.user.userId]);

    // respond with confirmation message
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Deletion failed' });
  }
};

// SEARCH Users by pattern
const searchUsers = async (req, res) => {
  // get query parameter from URL, e.g. ?query=abc
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ message: 'Search query is required' });
  }

  try {
    // ILIKE for case-insensitive search
    const pattern = `%${query}%`;

    // query database for usernames matching the pattern
    const users = await db.query(
      'SELECT id, username, created_at FROM users WHERE username ILIKE $1',
      [pattern]
    );

    // respond with the array of matching users
    res.json(users.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Search failed' });
  }
};


module.exports = { getUserProfile, updateUserProfile, deleteUser, searchUsers };