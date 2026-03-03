const express = require('express');
const router = express.Router();
const categoryController = require('./category.controller');
const { verifyToken } = require('../../middleware/auth.middleware');
const { requireRole } = require('../../middleware/role.middleware');

// Public routes
router.get('/', categoryController.getAll);
router.get('/:slug', categoryController.getBySlug);

// Admin routes
router.post('/', verifyToken, requireRole('ADMIN'), categoryController.create);
router.put('/:id', verifyToken, requireRole('ADMIN'), categoryController.update);
router.delete('/:id', verifyToken, requireRole('ADMIN'), categoryController.delete);

module.exports = router;