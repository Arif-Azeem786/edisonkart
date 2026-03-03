const express = require('express');
const router = express.Router();

// Import module routes
const authRoutes = require('./modules/auth/auth.routes');
const userRoutes = require('./modules/user/user.routes');
const categoryRoutes = require('./modules/category/category.routes');
const productRoutes = require('./modules/product/product.routes');
const cartRoutes = require('./modules/cart/cart.routes');
const orderRoutes = require('./modules/order/order.routes');
const paymentRoutes = require('./modules/payment/payment.routes'); // Add this
const adminRoutes = require('./modules/admin/admin.routes');
const deliveryRoutes = require('./modules/delivery/delivery.routes');
const contactRoutes = require('./modules/contact/contact.routes');
const reviewRoutes = require('./modules/review/review.routes');
const wishlistRoutes = require('./modules/wishlist/wishlist.routes');
const serviceabilityRoutes = require('./modules/delivery/serviceability.routes');

// Register routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes); // Add this
router.use('/admin', adminRoutes);
router.use('/delivery', deliveryRoutes);
router.use('/contact', contactRoutes);
router.use('/reviews', reviewRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/serviceability', serviceabilityRoutes);

module.exports = router;
