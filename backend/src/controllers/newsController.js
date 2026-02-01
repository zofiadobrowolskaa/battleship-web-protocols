const db = require('../config/db');

const createNews = async (req, res) => {
  const { title, content } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO news (title, content) VALUES ($1, $2) RETURNING *',
      [title, content]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Error creating news' });
  }
};

const getNews = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM news ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching news' });
  }
};

const updateNews = async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;
  try {
    const result = await db.query(
      'UPDATE news SET title = $1, content = $2 WHERE id = $3 RETURNING *',
      [title, content, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Error updating news' });
  }
};

const deleteNews = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM news WHERE id = $1', [id]);
    res.json({ message: 'News deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting news' });
  }
};

module.exports = { createNews, getNews, updateNews, deleteNews };