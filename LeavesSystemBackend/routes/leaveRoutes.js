const express      = require('express');
const router       = express.Router();
const controller   = require('../controllers/leaveController'); // 👈 everything in here now
const verifyToken  = require('../middlewares/verifyToken');
const verifyRole   = require('../middlewares/verifyRole');

// ─────────── Leave Request Routes ─────────── //
router.get('/mine', verifyToken, controller.getMyLeaves);
router.get('/balances', verifyToken, controller.getLeaveBalances);
router.get('/by-range', verifyToken, verifyRole('admin', 'hr'), controller.getLeavesByRange);
router.post('/', verifyToken, controller.createLeave);
router.post('/:id/approve', verifyToken, verifyRole('admin', 'hr'), controller.approveLeave);
router.get('/', verifyToken, verifyRole('admin', 'hr'), controller.getAllLeaves);

// ─────────── Leave Statistics Routes ─────────── //
router.get('/stats/status', verifyToken, verifyRole('admin', 'hr'), controller.getLeaveStatusStats);
router.get('/stats/type-days', verifyToken, verifyRole('admin', 'hr'), controller.getLeaveDaysByType);
router.get('/stats/gender', verifyToken, verifyRole('admin', 'hr'), controller.getLeaveDaysByGender);
router.get('/stats/monthly', verifyToken, verifyRole('admin', 'hr'), controller.getMonthlyLeaveStats);
router.get('/stats/department', verifyToken, verifyRole('admin', 'hr'), controller.getLeaveByDepartment);
router.get('/stats/top', verifyToken, verifyRole('admin', 'hr'), controller.getTopLeaveTakers);

module.exports = router;
