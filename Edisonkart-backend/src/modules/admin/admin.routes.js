const express = require('express');
const router = express.Router();
const adminController = require('./admin.controller');
const exportController = require('./export.controller');
const { verifyToken } = require('../../middleware/auth.middleware');
const { requireRole } = require('../../middleware/role.middleware');

// All admin routes require ADMIN role (EMPLOYEE is treated as ADMIN by middleware)
router.use(verifyToken);
router.use(requireRole('ADMIN'));

// Middleware to restrict certain routes to true ADMIN only (not EMPLOYEE)
const requireTrueAdmin = (req, res, next) => {
  // Allow EMPLOYEE and VENDOR to fetch DELIVERY boys for assigning orders
  if ((req.user.role === 'EMPLOYEE' || req.user.role === 'VENDOR') && req.method === 'GET' && req.path === '/users' && req.query.role === 'DELIVERY') {
    return next();
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only the main admin can perform this action.'
    });
  }
  next();
};

router.get('/dashboard', adminController.getDashboardStats);
router.get('/orders', adminController.getOrders);
router.get('/low-stock', adminController.getLowStockProducts);

// Only true ADMIN can manage users, create delivery boys, and create employees
router.get('/users', requireTrueAdmin, adminController.getUsers);
router.post('/delivery-boy', requireTrueAdmin, adminController.createDeliveryBoy);
router.post('/employee', requireTrueAdmin, adminController.createEmployee);
router.post('/vendor', requireTrueAdmin, adminController.createVendor);
router.put('/orders/:orderId/assign-delivery', adminController.assignDeliveryBoy);

// CSV Exports (admin only)
router.get('/export/orders', requireTrueAdmin, exportController.exportOrders);
router.get('/export/products', requireTrueAdmin, exportController.exportProducts);
router.get('/export/users', requireTrueAdmin, exportController.exportUsers);

module.exports = router;