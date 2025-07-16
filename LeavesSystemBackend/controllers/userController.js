const pool = require('../db');

exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await pool.execute(
      'SELECT ID, Fullname, Staffno, IDno, role, JobTitle, Jobgroup, Department, Gender, DOB FROM staff WHERE ID = ?',
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.status(200).json({ user: rows[0] });
  } catch (err) {
    console.error('[getUserProfile] Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
