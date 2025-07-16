const express      = require('express');
const router       = express.Router();
const controller   = require('../controllers/leaveController');
const verifyToken  = require('../middlewares/verifyToken');
const verifyRole   = require('../middlewares/verifyRole');

// View own leave requests
router.get('/mine', verifyToken, controller.getMyLeaves);

// View leave balances
router.get('/balances', verifyToken, controller.getLeaveBalances);

// View leave requests within a specific date range
router.get('/by-range', verifyToken, verifyRole('admin', 'hr'), controller.getLeavesByRange);

// Submit new leave request
router.post('/', verifyToken, controller.createLeave);

// Approve or reject leave
router.post('/:id/approve', verifyToken, verifyRole('admin', 'hr'), controller.approveLeave);

// View all leave requests (admin/hr only)
router.get('/', verifyToken, verifyRole('admin', 'hr'), controller.getAllLeaves);

module.exports = router;
