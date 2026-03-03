const express = require('express');
const router = express.Router();
const serviceabilityController = require('./serviceability.controller');
const { verifyToken } = require('../../middleware/auth.middleware');
const { requireRole } = require('../../middleware/role.middleware');

// Public route to check pincode
router.get('/check/:pincode', serviceabilityController.checkPincode);

// Admin only routes to manage pincodes
router.post('/manage', verifyToken, requireRole('ADMIN'), serviceabilityController.updatePincode);

module.exports = router;
