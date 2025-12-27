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