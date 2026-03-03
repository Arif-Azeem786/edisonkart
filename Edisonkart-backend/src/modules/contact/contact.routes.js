const express = require('express');
const router = express.Router();
const contactController = require('./contact.controller');
const { verifyToken } = require('../../middleware/auth.middleware');
const { requireRole } = require('../../middleware/role.middleware');

// Public route
router.post('/', contactController.create);

// Admin routes
router.get('/', verifyToken, requireRole('ADMIN'), contactController.getAll);
router.put('/:id/status', verifyToken, requireRole('ADMIN'), contactController.updateStatus);
router.delete('/:id', verifyToken, requireRole('ADMIN'), contactController.delete);

module.exports = router;
