const express = require('express');
const router = express.Router();
const orderController = require('./order.controller');
const { verifyToken } = require('../../middleware/auth.middleware');
const { requireRole } = require('../../middleware/role.middleware');

// Public webhook (no auth)
router.post('/webhook', orderController.handleWebhook);

// Protected routes
router.use(verifyToken);

router.post('/', orderController.createOrder);
router.get('/my-orders', orderController.getUserOrders);
router.get('/admin/returns', requireRole('ADMIN'), orderController.getReturnRequests);
router.get('/:orderId', orderController.getOrder);
router.post('/:orderId/cancel', orderController.cancelOrder);
router.post('/:orderId/return', orderController.requestReturn);
router.get('/:orderId/download-invoice', orderController.downloadInvoice);
router.put('/:orderId/status', requireRole('ADMIN'), orderController.updateOrderStatus);
router.post('/:orderId/return-action', requireRole('ADMIN'), orderController.approveReturn);

module.exports = router;