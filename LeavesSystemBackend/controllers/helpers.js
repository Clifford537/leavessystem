const pool = require('../db');

/**
 * Compute remaining leave days for the current calendar year.
 * @param {number} staffId
 * @param {number} leaveTypeId
 * @param {object} conn – optional existing pool / connection
 * @param {boolean} includePending – whether to include pending leaves
 * @returns {Promise<number>} remaining leave days
 */
async function getRemainingDays(
  staffId,
  leaveTypeId,
  conn = pool,
  includePending = false
) {
  const [[allow]] = await conn.execute(
    `SELECT s.Gender,
            CASE s.Gender WHEN 'Male' THEN lt.Male ELSE lt.Female END AS AnnualAllowance
       FROM staff s
       JOIN leave_types lt ON lt.ID = ?
      WHERE s.ID = ?`,
    [leaveTypeId, staffId]
  );

  if (!allow) throw new Error('Staff or leave type not found');

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

module.exports = {
  getRemainingDays
};
