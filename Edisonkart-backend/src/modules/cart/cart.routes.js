const express = require('express');
const router = express.Router();
const cartController = require('./cart.controller');
const { verifyToken } = require('../../middleware/auth.middleware');

router.use(verifyToken);

router.get('/', cartController.getCart);
router.post('/items', cartController.addItem);
router.put('/items/:itemId', cartController.updateItem);
router.delete('/items/:itemId', cartController.removeItem);
router.delete('/', cartController.clearCart);

module.exports = router;