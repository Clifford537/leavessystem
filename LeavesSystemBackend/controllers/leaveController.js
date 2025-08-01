// const axios = require('axios');
// const sharp = require('sharp');
// const path = require('path');
// const fs = require('fs');
const pool = require('../db');

//* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */
/**
 * Compute remaining leave days for the current calendar year.
 * @param {number}  staffId
 * @param {number}  leaveTypeId
 * @param {object}  conn             – existing pool / connection
 * @param {boolean} includePending   – true ⇒ subtract Approved + Pending
 *                                      false ⇒ subtract Approved only
 * @throws  if staff or leave type not found
 */
async function getRemainingDays(
  staffId,
  leaveTypeId,
  conn = pool,
  includePending = false            // default: Approved-only
) {
  /* annual allowance (gender-specific) */
  const [[allow]] = await conn.execute(
    `SELECT s.Gender,
            CASE s.Gender WHEN 'Male' THEN lt.Male ELSE lt.Female END AS AnnualAllowance
       FROM staff s
       JOIN leave_types lt ON lt.ID = ?
      WHERE s.ID = ?`,
    [leaveTypeId, staffId]
  );
  if (!allow) throw new Error('Staff or leave type not found');

  /* days already used */
  const approvedClause = includePending
    ? "IN ('Approved','Pending')"
    : "= 'Approved'";

  const [[usage]] = await conn.execute(
    `SELECT COALESCE(SUM(DaysDiff), 0) AS DaysUsed
       FROM leave_transactions
      WHERE StaffID     = ?
        AND LeaveTypeID = ?
        AND Approved    ${approvedClause}
        AND YEAR(fDate) = YEAR(CURDATE())`,
    [staffId, leaveTypeId]
  );

  return allow.AnnualAllowance - usage.DaysUsed;
}

/* -------------------------------------------------------------------------- */
/* Controllers                                                                */
/* -------------------------------------------------------------------------- */

// GET /api/leaves
exports.getAllLeaves = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT lt.ID,
              lt.StaffID,
              s.Fullname       AS StaffName,
              lt.LeaveTypeID,
              t.Name           AS LeaveTypeName,
              lt.fDate,
              lt.tDate,
              lt.Notes,
              lt.DaysDiff,
              lt.Attachment,
              lt.Approved,
              lt.UserID,
              lt.ApprovedID
         FROM leave_transactions lt
         JOIN staff       s ON s.ID = lt.StaffID
         JOIN leave_types t ON t.ID = lt.LeaveTypeID
     ORDER BY lt.fDate DESC`
    );
    res.status(200).json(rows);
  } catch (err) {
    console.error('[getAllLeaves]', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/leave/balances
exports.getLeaveBalances = async (req, res) => {
  try {
    const staffId = req.user.id;
    const [types] = await pool.execute(
      'SELECT ID, Name, Male, Female FROM leave_types'
    );

    /* subtract Approved only */
    const balances = await Promise.all(
      types.map(async (lt) => ({
        leaveTypeId:   lt.ID,
        leaveTypeName: lt.Name,
        remaining:     await getRemainingDays(staffId, lt.ID)   // no Pending
      }))
    );

    res.status(200).json(balances);
  } catch (err) {
    console.error('[getLeaveBalances]', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// POST /api/leaves
exports.createLeave = async (req, res) => {
  const { LeaveTypeID, fDate, tDate, Notes } = req.body;
  const StaffID = req.user.id;
  const UserID = req.user.id;

  // Accept either file or link
  const uploadedFile = req.file ? `/uploads/${req.file.filename}` : null;
  const providedLink = !req.file && req.body.Attachment ? req.body.Attachment : null;
  const Attachment = uploadedFile || providedLink;

  /* Validation */
  const errors = {};
  if (!LeaveTypeID) errors.LeaveTypeID = 'Leave type required';
  if (!fDate) errors.fDate = 'Start date required';
  if (!tDate) errors.tDate = 'End date required';
  if (Object.keys(errors).length) {
    return res.status(400).json({ message: 'Validation error', errors });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[ltExists]] = await conn.execute(
      'SELECT 1 FROM leave_types WHERE ID = ?',
      [LeaveTypeID]
    );
    if (!ltExists) {
      await conn.rollback();
      return res.status(404).json({ message: 'Invalid leave type' });
    }

    const [[{ DaysDiff }]] = await conn.execute(
      'SELECT DATEDIFF(?, ?) + 1 AS DaysDiff',
      [tDate, fDate]
    );
    if (DaysDiff <= 0) {
      await conn.rollback();
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    const remaining = await getRemainingDays(StaffID, LeaveTypeID, conn, false);
    if (DaysDiff > remaining) {
      await conn.rollback();
      return res.status(409).json({
        message: `Insufficient balance – ${remaining} day(s) left`
      });
    }

    const [ins] = await conn.execute(
      `INSERT INTO leave_transactions
         (StaffID, LeaveTypeID, fDate, tDate, Notes,
          DaysDiff, Attachment, Approved, UserID, ApprovedID)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending', ?, 0)`,
      [StaffID, LeaveTypeID, fDate, tDate, Notes || null, DaysDiff, Attachment, UserID]
    );

    await conn.commit();
    res.status(201).json({
      message: 'Leave request submitted',
      leaveId: ins.insertId,
      daysLeft: remaining,
      attachment: Attachment || null
    });
  } catch (err) {
    await conn.rollback();
    console.error('[createLeave]', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  } finally {
    conn.release();
  }
};

// PUT /api/leaves/:id/approve
exports.approveLeave = async (req, res) => {
  const leaveId   = req.params.id;
  const { status }= req.body;
  const approver  = req.user.id;
  const ok        = ['Approved', 'Rejected'];

  if (!ok.includes(status)) {
    return res.status(400).json({ message: 'Status must be Approved or Rejected' });
  }

  try {
    const [[row]] = await pool.execute(
      'SELECT ID FROM leave_transactions WHERE ID = ?',
      [leaveId]
    );
    if (!row) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    const [upd] = await pool.execute(
      `UPDATE leave_transactions
          SET Approved = ?, ApprovedID = ?
        WHERE ID = ?`,
      [status, approver, leaveId]
    );

    res.status(200).json({
      message: `Leave ${status.toLowerCase()}`,
      affectedRows: upd.affectedRows
    });
  } catch (err) {
    console.error('[approveLeave]', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/leave/mine
exports.getMyLeaves = async (req, res) => {
  const staffId = req.user.id;

  try {
    const [rows] = await pool.execute(
      `SELECT lt.ID,
              lt.LeaveTypeID,
              t.Name AS LeaveTypeName,
              lt.fDate,
              lt.tDate,
              lt.Notes,
              lt.DaysDiff,
              lt.Attachment,
              lt.Approved
         FROM leave_transactions lt
         JOIN leave_types t ON t.ID = lt.LeaveTypeID
        WHERE lt.StaffID = ?
     ORDER BY lt.fDate DESC`,
      [staffId]
    );

    return res.status(200).json(rows);
  } catch (err) {
    console.error('[getMyLeaves]', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/leaves/by-range?from=YYYY-MM-DD&to=YYYY-MM-DD
exports.getLeavesByRange = async (req, res) => {
  const { from, to } = req.query;

  if (!from || !to) {
    return res.status(400).json({ message: 'Missing "from" or "to" query parameter' });
  }

  try {
    const [rows] = await pool.execute(
      `SELECT lt.ID,
              lt.StaffID,
              s.Fullname AS StaffName,
              lt.LeaveTypeID,
              t.Name AS LeaveTypeName,
              lt.fDate,
              lt.tDate,
              lt.DaysDiff,
              lt.Attachment,
              lt.Approved
         FROM leave_transactions lt
         JOIN staff s ON s.ID = lt.StaffID
         JOIN leave_types t ON t.ID = lt.LeaveTypeID
        WHERE lt.fDate <= ?
          AND lt.tDate >= ?
     ORDER BY lt.fDate ASC`,
      [to + ' 23:59:59', from + ' 00:00:00']
    );

    // Create a cache so we don’t query the same staff/leaveType pair repeatedly
    const balanceCache = new Map();

    // Compute remaining days per leave entry
    const resultsWithBalances = await Promise.all(
      rows.map(async (leave) => {
        const key = `${leave.StaffID}_${leave.LeaveTypeID}`;

        if (!balanceCache.has(key)) {
          try {
            const remaining = await getRemainingDays(leave.StaffID, leave.LeaveTypeID);
            balanceCache.set(key, remaining);
          } catch (err) {
            console.warn(`Failed to get balance for StaffID ${leave.StaffID}, LeaveTypeID ${leave.LeaveTypeID}`);
            balanceCache.set(key, null);
          }
        }

        return {
          ...leave,
          RemainingDays: balanceCache.get(key)
        };
      })
    );

    res.status(200).json(resultsWithBalances);
  } catch (err) {
    console.error('[getLeavesByRange]', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/leaves/stats/status
exports.getLeaveStatusStats = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT Approved, COUNT(*) AS count
      FROM leave_transactions
      GROUP BY Approved
    `);
    res.status(200).json(rows);
  } catch (err) {
    console.error('[getLeaveStatusStats]', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/leaves/stats/type-days
exports.getLeaveDaysByType = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT t.Name AS LeaveType, SUM(lt.DaysDiff) AS TotalDays
      FROM leave_transactions lt
      JOIN leave_types t ON t.ID = lt.LeaveTypeID
      WHERE lt.Approved = 'Approved'
      GROUP BY t.Name
    `);
    res.status(200).json(rows);
  } catch (err) {
    console.error('[getLeaveDaysByType]', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/leaves/stats/gender
exports.getLeaveDaysByGender = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT s.Gender, SUM(lt.DaysDiff) AS TotalDays
      FROM leave_transactions lt
      JOIN staff s ON lt.StaffID = s.ID
      WHERE lt.Approved = 'Approved'
      GROUP BY s.Gender
    `);
    res.status(200).json(rows);
  } catch (err) {
    console.error('[getLeaveDaysByGender]', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/leaves/stats/monthly
exports.getMonthlyLeaveStats = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT DATE_FORMAT(fDate, '%Y-%m') AS Month, SUM(DaysDiff) AS TotalDays
      FROM leave_transactions
      WHERE Approved = 'Approved'
      GROUP BY Month
      ORDER BY Month ASC
    `);
    res.status(200).json(rows);
  } catch (err) {
    console.error('[getMonthlyLeaveStats]', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/leaves/stats/department
exports.getLeaveByDepartment = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT s.Department, COUNT(lt.ID) AS RequestCount
      FROM leave_transactions lt
      JOIN staff s ON s.ID = lt.StaffID
      GROUP BY s.Department
    `);
    res.status(200).json(rows);
  } catch (err) {
    console.error('[getLeaveByDepartment]', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/leaves/stats/top
exports.getTopLeaveTakers = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT s.Fullname, COUNT(*) AS LeaveCount, SUM(lt.DaysDiff) AS TotalDays
      FROM leave_transactions lt
      JOIN staff s ON s.ID = lt.StaffID
      WHERE lt.Approved = 'Approved'
      GROUP BY s.Fullname
      ORDER BY TotalDays DESC
      LIMIT 5
    `);
    res.status(200).json(rows);
  } catch (err) {
    console.error('[getTopLeaveTakers]', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};