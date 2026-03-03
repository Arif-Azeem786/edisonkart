const express = require('express');
const router = express.Router();
const wishlistController = require('./wishlist.controller');
const { verifyToken } = require('../../middleware/auth.middleware');

router.use(verifyToken);

router.post('/toggle', wishlistController.toggleWishlist);
router.get('/', wishlistController.getWishlist);

module.exports = router;
