// src/routes/dashboard.js
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const auth = require('../middleware/auth');

// GET /api/dashboard/stats
router.get('/stats', auth, dashboardController.getStats);

// GET /api/dashboard/audit-logs
router.get('/audit-logs', auth, dashboardController.getAuditLogs);

module.exports = router;
