const pool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Strong password validator
const isStrongPassword = (password) => {
  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
  return strongPasswordRegex.test(password);
};

// Set initial password
exports.setPassword = async (req, res) => {
  const { idno, staffno, password } = req.body;

  const errors = {};
  if (!idno) errors.idno = 'ID number is required.';
  if (!staffno) errors.staffno = 'Staff number is required.';
  if (!password) errors.password = 'Password is required.';

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: 'Validation error', errors });
  }

  if (!isStrongPassword(password)) {
    return res.status(400).json({
      message: 'Weak password',
      errors: {
        password:
          'Password must be at least 8 characters, include uppercase, lowercase, number, and special character.',
      },
    });
  }

  try {
    const [rows] = await pool.execute(
      'SELECT * FROM staff WHERE IDno = ? AND Staffno = ?',
      [idno, staffno]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found. Check your ID number and staff number.' });
    }

    const user = rows[0];

    if (user.Pass) {
      return res.status(409).json({ message: 'Password already set. Please log in instead.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.execute(
      'UPDATE staff SET Pass = ? WHERE IDno = ? AND Staffno = ?',
      [hashedPassword, idno, staffno]
    );

    return res.status(200).json({ message: 'Password set successfully. You can now log in.' });
  } catch (err) {
    console.error('[setPassword] Error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Login
exports.login = async (req, res) => { 
  const { idno, password } = req.body;

  const errors = {};
  if (!idno) errors.idno = 'ID number is required.';
  if (!password) errors.password = 'Password is required.';

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: 'Validation error', errors });
  }

  try {
    const [rows] = await pool.execute(
      'SELECT ID, Fullname, Pass, role, JobTitle FROM staff WHERE IDno = ?',
      [idno]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found. Please check your ID number.' });
    }

    const user = rows[0];

    if (!user.Pass) {
      return res.status(403).json({ message: 'Please set your password before logging in.' });
    }

    const isMatch = await bcrypt.compare(password.trim(), user.Pass.trim());

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password. Please try again.' });
    }

    // ⏳ Token expires in 3 hours
    const token = jwt.sign(
      {
        id: user.ID,
        role: user.role,
        jobTitleId: user.JobTitle,
      },
      process.env.JWT_SECRET,
      { expiresIn: '3h' }
    );

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.ID,
        fullname: user.Fullname,
        role: user.role,
        jobTitleId: user.JobTitle,
      },
    });
  } catch (err) {
    console.error('[login] Error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.verifyUser = async (req, res) => {
  const { idno, staffno } = req.body;

  if (!idno || !staffno) {
    return res.status(400).json({
      message: 'ID number and Staff number are required.'
    });
  }

  try {
    const [rows] = await pool.execute(
      'SELECT IDno, Staffno, Pass FROM staff WHERE IDno = ? AND Staffno = ?',
      [idno, staffno]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found. Check your ID and Staff number.' });
    }

    const user = rows[0];

    if (user.Pass) {
      return res.status(409).json({ message: 'Password already set. Please log in.' });
    }

    return res.status(200).json({ message: 'User verified successfully.' });
  } catch (err) {
    console.error('[verifyUser] Error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};
