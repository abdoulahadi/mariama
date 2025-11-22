// src/routes/users.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

// GET /api/users/profile
router.get('/profile', auth, userController.getProfile);

// GET /api/users
router.get('/', auth, userController.listUsers);

// PUT /api/users/:id
router.put('/:id', auth, userController.updateUser);

module.exports = router;
