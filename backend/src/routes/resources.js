// src/routes/resources.js
const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resourceController');
const auth = require('../middleware/auth');
const checkPermission = require('../middleware/permitCheck');

// POST /api/resources
router.post('/', auth, resourceController.createResource);

// GET /api/resources
router.get('/', auth, resourceController.listResources);

// GET /api/resources/:id
router.get('/:id', auth, checkPermission('read'), resourceController.getResource);

// PUT /api/resources/:id
router.put('/:id', auth, checkPermission('write'), resourceController.updateResource);

// DELETE /api/resources/:id
router.delete('/:id', auth, checkPermission('delete'), resourceController.deleteResource);

module.exports = router;
