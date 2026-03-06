const express = require('express');
const router = express.Router();
const couponController = require('./coupon.controller');
const { verifyToken } = require('../../middleware/auth.middleware');
const { requireRole } = require('../../middleware/role.middleware');

router.post('/apply', verifyToken, couponController.apply);
router.post('/remove', verifyToken, couponController.remove);

router.get('/', verifyToken, requireRole('ADMIN'), couponController.getAll);
router.post('/', verifyToken, requireRole('ADMIN'), couponController.create);
router.put('/:id', verifyToken, requireRole('ADMIN'), couponController.update);
router.delete('/:id', verifyToken, requireRole('ADMIN'), couponController.delete);

module.exports = router;
