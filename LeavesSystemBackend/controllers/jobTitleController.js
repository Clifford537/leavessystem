const pool = require('../db');

exports.getAllJobTitles = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM jobtitles');
    res.status(200).json(rows);
  } catch (err) {
    console.error('[getAllJobTitles] Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
