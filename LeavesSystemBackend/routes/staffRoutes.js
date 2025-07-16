const express = require('express');
const router = express.Router();

const staffController = require('../controllers/staffController');
const verifyToken = require('../middlewares/verifyToken');
const verifyRole = require('../middlewares/verifyRole'); 

// Call the returned function
router.get('/', verifyToken, verifyRole('admin', 'hr'), staffController.getAllStaff);

//  Get staff by ID
router.get('/:id', verifyToken, verifyRole('admin', 'hr'), staffController.getStaffById);

module.exports = router;
