const Review = require('./review.model');
const Product = require('../product/product.model');
const { successResponse, errorResponse } = require('../../utils/responseFormatter');

const reviewController = {
  // Create review
  async createReview(req, res, next) {
    try {
      const { productId, rating, comment } = req.body;
      const userId = req.user.userId;

      // Check if product exists
      const product = await Product.findById(productId);
      if (!product) {
        return errorResponse(res, 'Product not found', 404);
      }

      // Check if user already reviewed
      const existingReview = await Review.findOne({ product: productId, user: userId });
      if (existingReview) {
        return errorResponse(res, 'You have already reviewed this product', 400);
      }

      // Create review
      const review = await Review.create({
        product: productId,
        user: userId,
        rating,
        comment
      });

      // Update product's averageRating and numReviews
      const reviews = await Review.find({ product: productId });
      const numReviews = reviews.length;
      const averageRating = reviews.reduce((acc, item) => item.rating + acc, 0) / numReviews;

      await Product.findByIdAndUpdate(productId, {
        averageRating,
        numReviews
      });

      successResponse(res, review, 'Review added successfully', 201);
    } catch (error) {
      next(error);
    }
  },

  // Get reviews for a product
  async getProductReviews(req, res, next) {
    try {
      const { productId } = req.params;
      
      const reviews = await Review.find({ product: productId })
        .populate('user', 'name')
        .sort('-createdAt');

      successResponse(res, reviews, 'Reviews fetched successfully');
    } catch (error) {
      next(error);
    }
  }
};

module.exports = reviewController;
