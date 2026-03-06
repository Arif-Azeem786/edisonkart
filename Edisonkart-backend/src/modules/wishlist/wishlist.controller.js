const Wishlist = require('./wishlist.model');
const { successResponse, errorResponse } = require('../../utils/responseFormatter');

const wishlistController = {
    // Toggle product in wishlist
    async toggleWishlist(req, res, next) {
        try {
            const { productId } = req.body;
            const userId = req.user.userId;

            let wishlist = await Wishlist.findOne({ user: userId });

            if (!wishlist) {
                wishlist = await Wishlist.create({ user: userId, products: [productId] });
                return successResponse(res, wishlist, 'Product added to wishlist', 201);
            }

            const productIndex = wishlist.products.findIndex(p => p.toString() === productId);
            let message = '';
            
            if (productIndex === -1) {
                wishlist.products.push(productId);
                message = 'Product added to wishlist';
            } else {
                wishlist.products.splice(productIndex, 1);
                message = 'Product removed from wishlist';
            }

            await wishlist.save();
            successResponse(res, wishlist, message);
        } catch (error) {
            next(error);
        }
    },

    // Get user's wishlist
    async getWishlist(req, res, next) {
        try {
            const userId = req.user.userId;
            const wishlist = await Wishlist.findOne({ user: userId }).populate('products');
            
            if (!wishlist) {
                return successResponse(res, { products: [] }, 'Wishlist is empty');
            }

            successResponse(res, wishlist, 'Wishlist fetched successfully');
        } catch (error) {
            next(error);
        }
    }
};

module.exports = wishlistController;
