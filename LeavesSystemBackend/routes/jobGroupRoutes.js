const express = require('express');
const router = express.Router();
const jobGroupController = require('../controllers/jobGroupController');

// Middlewares
const verifyToken = require('../middlewares/verifyToken');
const verifyRole = require('../middlewares/verifyRole');

// Only accessible by HR and Admin
router.get('/', verifyToken, verifyRole('admin', 'hr'), jobGroupController.getAllJobGroups);

module.exports = router;
