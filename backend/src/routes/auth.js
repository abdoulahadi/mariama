// src/routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

// POST /api/auth/login - Public
router.post('/login', authController.login);

// POST /api/auth/register - Admin only (DEPARTMENT_HEAD)
router.post('/register', auth, authController.register);

// GET /api/auth/permissions - Get current user permissions
router.get('/permissions', auth, authController.getPermissions);

// POST /api/auth/refresh-permissions - Force refresh permissions from Permit.io
router.post('/refresh-permissions', auth, authController.refreshPermissions);

module.exports = router;
