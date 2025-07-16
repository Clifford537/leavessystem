const pool = require('../db');

// Common SELECT with JOINs to pull readable names
const BASE_SELECT = `
  SELECT 
    s.ID,
    s.Fullname,
    s.Staffno,
    s.IDno,
    s.DocType,
    s.PINno,
    s.NHIF,
    s.NSSF,
    s.Address,
    s.Address2,
    s.Cellphone,
    s.HomeTel,
    s.NextofKin,
    s.NextofKinTel,
    s.ContractID,
    jg.Name  AS JobgroupName,
    jt.Name  AS JobTitleName,
    d.Name   AS DepartmentName,
    s.Gender,
    s.DOB,
    s.Pass,
    s.Userright
  FROM staff s
  LEFT JOIN jobgroup   jg ON jg.ID = s.Jobgroup
  LEFT JOIN jobtitles  jt ON jt.ID = s.JobTitle
  LEFT JOIN departments d  ON d.ID  = s.Department
`;

exports.getAllStaff = async (req, res) => {
  try {
    const [rows] = await pool.execute(BASE_SELECT);
    res.status(200).json(rows);
  } catch (err) {
    console.error('[getAllStaff] Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getStaffById = async (req, res) => {
  const staffId = req.params.id;

  try {
    const [rows] = await pool.execute(
      `${BASE_SELECT} WHERE s.ID = ?`,
      [staffId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Staff member not found.' });
    }

    res.status(200).json(rows[0]);
  } catch (err) {
    console.error('[getStaffById] Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
