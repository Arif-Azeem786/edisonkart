const express = require('express');
const router = express.Router();
const paymentController = require('./payment.controller');
const { verifyToken } = require('../../middleware/auth.middleware');
const { requireRole } = require('../../middleware/role.middleware');

// All routes below require authentication
router.use(verifyToken);

// Check payment status by orderId
router.get('/order/:orderId', paymentController.getPaymentStatus);

// User routes
router.post('/order/:orderId/retry', paymentController.retryPayment);

// Admin only routes
router.get('/', requireRole('ADMIN'), paymentController.getAllPayments);
router.get('/stats', requireRole('ADMIN'), paymentController.getPaymentStats);
router.get('/:id', requireRole('ADMIN'), paymentController.getPaymentById);
router.post('/order/:orderId/verify', requireRole('ADMIN'), paymentController.verifyPayment);

module.exports = router;