const express = require('express');
const router = express.Router();
const jobTitleController = require('../controllers/jobTitleController');

// Middlewares
const verifyToken = require('../middlewares/verifyToken');
const verifyRole = require('../middlewares/verifyRole');

// Protect route
router.get('/', verifyToken, verifyRole('admin', 'hr'), jobTitleController.getAllJobTitles);

module.exports = router;
