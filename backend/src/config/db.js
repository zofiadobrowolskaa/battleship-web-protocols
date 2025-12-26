// pool allows the server to handle multiple requests efficiently
// without opening a new connection every time
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: 5432,
});

pool.on('connect', () => {
  console.log('Connected to the PostgreSQL database');
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};