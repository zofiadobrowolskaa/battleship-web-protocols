const db = require('../config/db');

// report controllers

// create a new user report
const createReport = async (req, res) => {
  const { username, message } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO reports (username, message) VALUES ($1, $2) RETURNING *',
      [username, message]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Error creating report' });
  }
};

// fetch all reports sorted by newest
const getReports = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM reports ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching reports' });
  }
};

// update report resolution status
const updateReport = async (req, res) => {
  const { id } = req.params;
  const { is_resolved } = req.body;
  try {
    const result = await db.query(
      'UPDATE reports SET is_resolved = $1 WHERE id = $2 RETURNING *',
      [is_resolved, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Error updating report' });
  }
};

// delete a report by ID
const deleteReport = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM reports WHERE id = $1', [id]);
    res.json({ message: 'Report deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting report' });
  }
};

// game history controllers

// retrieve full game history
const getAllHistory = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM games_history ORDER BY played_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching history' });
  }
};

// update game finish reason (e.g., correct a forfeit)
const updateHistory = async (req, res) => {
  const { id } = req.params;
  const { finish_reason } = req.body;
  try {
    const result = await db.query(
      'UPDATE games_history SET finish_reason = $1 WHERE id = $2 RETURNING *',
      [finish_reason, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Error updating history' });
  }
};

// remove a specific game record
const deleteHistory = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM games_history WHERE id = $1', [id]);
    res.json({ message: 'History entry deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting history entry' });
  }
};

module.exports = {
  createReport, getReports, updateReport, deleteReport,
  getAllHistory, updateHistory, deleteHistory
};