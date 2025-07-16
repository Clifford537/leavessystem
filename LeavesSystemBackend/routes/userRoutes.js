const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Middlewares
const verifyToken = require('../middlewares/verifyToken');

router.get('/me', verifyToken, userController.getUserProfile);

module.exports = router;
