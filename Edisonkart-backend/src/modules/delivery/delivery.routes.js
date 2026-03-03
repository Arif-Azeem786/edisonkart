const express = require('express');
const router = express.Router();
const deliveryController = require('./delivery.controller');
const { verifyToken } = require('../../middleware/auth.middleware');
const { requireRole } = require('../../middleware/role.middleware');

router.use(verifyToken);
router.use(requireRole('DELIVERY'));

router.get('/orders', deliveryController.getAssignedOrders);
router.get('/stats', deliveryController.getStats);
router.put('/orders/:orderId/status', deliveryController.updateDeliveryStatus);

module.exports = router;