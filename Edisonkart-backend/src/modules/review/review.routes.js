const express = require('express');
const router = express.Router();
const reviewController = require('./review.controller');
const { verifyToken } = require('../../middleware/auth.middleware');

// Public routes
router.get('/product/:productId', reviewController.getProductReviews);

// Protected routes
router.post('/', verifyToken, reviewController.createReview);

module.exports = router;
