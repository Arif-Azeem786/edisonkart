const express = require('express');
const router = express.Router();
const userController = require('./user.controller');
const { verifyToken } = require('../../middleware/auth.middleware');

const { upload } = require('../../config/gridfs');

// Public route for fetching avatar
router.get('/avatar/:imageId', userController.getAvatar);

router.use(verifyToken);

router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.put('/avatar', upload.single('avatar'), userController.uploadAvatar);
router.get('/orders', userController.getOrderHistory);

// Address routes
router.post('/addresses', userController.addAddress);
router.put('/addresses/:addressId', userController.updateAddress);
router.delete('/addresses/:addressId', userController.deleteAddress);

module.exports = router;