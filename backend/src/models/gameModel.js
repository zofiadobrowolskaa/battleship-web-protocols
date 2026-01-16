const db = require('../config/db');

const Game = {
  // saves the result of a finished match to the database
  recordGame: async (winner, loser, reason) => {
    const query = `
      INSERT INTO games_history (winner_username, loser_username, finish_reason)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    try {
      const res = await db.query(query, [winner, loser, reason]);
      return res.rows[0];
    } catch (err) {
      console.error("Error recording game history:", err);
      throw err;
    }
  },

  // retrieves win/loss statistics for a specific user from games_history table
  getUserStats: async (username) => {
    const query = `
      SELECT 
        COUNT(*) FILTER (WHERE winner_username = $1) as wins,
        COUNT(*) FILTER (WHERE loser_username = $1) as losses,
        COUNT(*) as total_games
      FROM games_history
      WHERE winner_username = $1 OR loser_username = $1;
    `;
    try {
      const res = await db.query(query, [username]);
      return res.rows[0];
    } catch (err) {
      console.error("Error fetching user stats:", err);
      throw err;
    }
  }
};

module.exports = Game;