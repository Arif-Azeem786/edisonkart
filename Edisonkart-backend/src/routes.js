const express = require('express');
const router = express.Router();

// Import module routes
const authRoutes = require('./modules/auth/auth.routes');
const userRoutes = require('./modules/user/user.routes');
const categoryRoutes = require('./modules/category/category.routes');
const productRoutes = require('./modules/product/product.routes');
const cartRoutes = require('./modules/cart/cart.routes');
const orderRoutes = require('./modules/order/order.routes');
const paymentRoutes = require('./modules/payment/payment.routes');
const adminRoutes = require('./modules/admin/admin.routes');
const deliveryRoutes = require('./modules/delivery/delivery.routes');
const contactRoutes = require('./modules/contact/contact.routes');
const reviewRoutes = require('./modules/review/review.routes');
const wishlistRoutes = require('./modules/wishlist/wishlist.routes');
const serviceabilityRoutes = require('./modules/delivery/serviceability.routes');
const chatRoutes = require('./modules/chat/chat.routes');
const bannerRoutes = require('./modules/banner/banner.routes');
const couponRoutes = require('./modules/coupon/coupon.routes');
const notificationRoutes = require('./modules/notification/notification.routes');
const qaRoutes = require('./modules/qa/qa.routes');
const referralRoutes = require('./modules/referral/referral.routes');
const settingsRoutes = require('./modules/settings/settings.routes');

// Register routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);
router.use('/admin', adminRoutes);
router.use('/delivery', deliveryRoutes);
router.use('/contact', contactRoutes);
router.use('/reviews', reviewRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/serviceability', serviceabilityRoutes);
router.use('/chat', chatRoutes);
router.use('/banners', bannerRoutes);
router.use('/coupons', couponRoutes);
router.use('/notifications', notificationRoutes);
router.use('/qa', qaRoutes);
router.use('/loyalty', referralRoutes);
router.use('/settings', settingsRoutes);

module.exports = router;
