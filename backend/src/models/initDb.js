const db = require('../config/db');

const initDb = async () => {
  const createTablesQuery = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(250) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS games_history (
      id SERIAL PRIMARY KEY,
      winner_username VARCHAR(50) NOT NULL,
      loser_username VARCHAR(50) NOT NULL,
      finish_reason VARCHAR(20) NOT NULL, -- 'destruction' or 'forfeit'
      played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await db.query(createTablesQuery);
    console.log("Database tables initialized");
  } catch (err) {
    console.error("Error initializing database:", err);
    process.exit(1);
  }
};

module.exports = initDb;