const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Routes
router.post('/setpassword', authController.setPassword);
router.post('/login', authController.login);
router.post('/verify-user', authController.verifyUser);

module.exports = router;
