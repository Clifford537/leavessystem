const pool = require('../db');

exports.getAllJobGroups = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM jobgroup');
    res.status(200).json(rows);
  } catch (err) {
    console.error('[getAllJobGroups] Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
