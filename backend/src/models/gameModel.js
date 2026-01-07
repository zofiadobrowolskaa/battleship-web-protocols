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
  }
};

module.exports = Game;