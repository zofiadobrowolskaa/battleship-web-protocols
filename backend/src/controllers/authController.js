const db = require('../config/db');
const bcrypt = require('bcryptjs');

const validateRegister = (username, email, password) => {
  if (!username || username.length < 3) {
    return 'Username must be at least 3 characters';
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return 'Invalid email format';
  }

  if (!password || password.length < 6) {
    return 'Password must be at least 6 characters';
  }

  return null;
};

// controller for registering a new user
const register = async (req, res) => {
  const { username, email, password } = req.body;

  // validation input
  const validationError = validateRegister(username, email, password);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    const userExists = await db.query(
        'SELECT username, email FROM users WHERE username = $1 OR email = $2',
        [username, email]
    );

    if (userExists.rows.length > 0) {
        if (userExists.rows[0].username === username) {
            return res.status(400).json({ message: 'Username already taken' });
        }
        if (userExists.rows[0].email === email) {
            return res.status(400).json({ message: 'Email already taken' });
        }
    }
    
    // hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // insert the new user into the database
    const newUser = await db.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email',
      [username, email, hashedPassword]
    );

    // respond with the created user (without password)
    res.status(201).json({
      message: 'User registered successfully',
      user: newUser.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

module.exports = { register };
