const Payment = require('./payment.model');
const Order = require('../order/order.model');
const User = require('../user/user.model'); // Add this line
const Product = require('../product/product.model'); // Add this if not already there
const Cart = require('../cart/cart.model'); // Add this if not already there
const razorpayService = require('../../config/razorpay');
const { successResponse, errorResponse } = require('../../utils/responseFormatter');

const paymentController = {
  // Get payment status for an order
  async getPaymentStatus(req, res, next) {
    try {
      const { orderId } = req.params;

      const payment = await Payment.findOne({ orderId });
      if (!payment) {
        return errorResponse(res, 'Payment not found', 404);
      }

      // Check if user owns this order (unless admin)
      const order = await Order.findOne({ orderId });
      if (!order) {
        return errorResponse(res, 'Order not found', 404);
      }

      if (req.user && order.userId.toString() !== req.user.userId && req.user.role !== 'ADMIN') {
        return errorResponse(res, 'Access denied', 403);
      }

      // Get latest status from Razorpay if payment is still pending
      if (payment.status === 'PENDING') {
        try {
          const razorpayStatus = await razorpayService.getOrderStatus(payment.gatewayOrderId);

          // Update payment status if changed — only process if not already handled
          if (razorpayStatus.order_status === 'PAID' && payment.status !== 'SUCCESS') {
            payment.status = 'SUCCESS';
            await payment.save();

            // Only deduct stock and clear cart if order wasn't already marked PAID (idempotency guard)
            if (order.paymentStatus !== 'PAID') {
              order.paymentStatus = 'PAID';
              await order.save();

              for (const item of order.items) {
                if (item.variantId) {
                  await Product.updateOne(
                    { _id: item.productId, 'variants._id': item.variantId },
                    { $inc: { 'variants.$.stock': -item.quantity } }
                  );
                } else {
                  await Product.updateOne(
                    { _id: item.productId, stock: { $gte: item.quantity } },
                    { $inc: { stock: -item.quantity } }
                  );
                }
              }

              await Cart.deleteOne({ userId: order.userId });
            }
          }
        } catch (error) {
          console.error('Failed to fetch payment status from Razorpay:', error);
        }
      }

      successResponse(res, {
        orderId: payment.orderId,
        status: payment.status,
        amount: payment.amount,
        transactionId: payment.transactionId,
        createdAt: payment.createdAt
      });
    } catch (error) {
      next(error);
    }
  },

  // Get all payments (Admin only)
  async getAllPayments(req, res, next) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        startDate,
        endDate
      } = req.query;

      const query = {};
      if (status) query.status = status;
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      const skip = (page - 1) * limit;

      const payments = await Payment.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean();

      const total = await Payment.countDocuments(query);

      // Get order details for each payment
      for (let payment of payments) {
        const order = await Order.findOne({ orderId: payment.orderId })
          .select('userId totalAmount orderStatus')
          .lean();
        payment.order = order;
      }

      // Calculate stats
      const stats = await Payment.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' }
          }
        }
      ]);

      successResponse(res, {
        payments,
        stats,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get payment by ID (Admin only)
  async getPaymentById(req, res, next) {
    try {
      const { id } = req.params;

      const payment = await Payment.findById(id).lean();
      if (!payment) {
        return errorResponse(res, 'Payment not found', 404);
      }

      // Get order details
      const order = await Order.findOne({ orderId: payment.orderId })
        .populate('userId', 'name email')
        .lean();

      successResponse(res, {
        ...payment,
        order
      });
    } catch (error) {
      next(error);
    }
  },

  // Retry failed payment
  async retryPayment(req, res, next) {
    try {
      const { orderId } = req.params;

      // Find payment
      const payment = await Payment.findOne({ orderId });
      if (!payment) {
        return errorResponse(res, 'Payment not found', 404);
      }

      // Check if payment can be retried
      if (payment.status !== 'FAILED') {
        return errorResponse(res, 'Only failed payments can be retried', 400);
      }

      // Find order
      const order = await Order.findOne({ orderId });
      if (!order) {
        return errorResponse(res, 'Order not found', 404);
      }

      // Check if user owns this order
      if (order.userId.toString() !== req.user.userId) {
        return errorResponse(res, 'Access denied', 403);
      }

      // Check if order is still valid for payment
      if (order.paymentStatus === 'PAID') {
        return errorResponse(res, 'Order is already paid', 400);
      }

      // Create new Razorpay order
      const user = await User.findById(req.user.userId);
      const razorpayOrder = await razorpayService.createOrder({
        orderId: order.orderId,
        amount: order.totalAmount,
        customerName: user.name,
        customerEmail: user.email,
        customerPhone: order.addressSnapshot.phone
      });

      // Update payment record with new Razorpay order ID
      payment.gatewayOrderId = razorpayOrder.id;
      payment.status = 'PENDING';
      payment.rawResponse = null;
      await payment.save();

      successResponse(res, {
        orderId: order.orderId,
        razorpayOrderId: razorpayOrder.id,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
        // Backward-compatible field name used previously for Cashfree
        paymentSessionId: razorpayOrder.id,
        amount: order.totalAmount
      }, 'Payment retry initiated');
    } catch (error) {
      next(error);
    }
  },

  // Manual payment verification (Admin only - for troubleshooting)
  async verifyPayment(req, res, next) {
    try {
      const { orderId } = req.params;

      const payment = await Payment.findOne({ orderId });
      if (!payment) {
        return errorResponse(res, 'Payment not found', 404);
      }

      // Fetch status from Razorpay
      const razorpayStatus = await razorpayService.getOrderStatus(payment.gatewayOrderId);

      // Update payment status
      const oldStatus = payment.status;
      payment.status = razorpayStatus.order_status === 'PAID' ? 'SUCCESS' : 'FAILED';
      payment.rawResponse = razorpayStatus;
      await payment.save();

      // If payment succeeded, update order — only if not already processed (idempotency guard)
      if (payment.status === 'SUCCESS' && oldStatus !== 'SUCCESS') {
        const order = await Order.findOne({ orderId });
        if (order && order.paymentStatus !== 'PAID') {
          order.paymentStatus = 'PAID';
          await order.save();

          for (const item of order.items) {
            if (item.variantId) {
              await Product.updateOne(
                { _id: item.productId, 'variants._id': item.variantId },
                { $inc: { 'variants.$.stock': -item.quantity } }
              );
            } else {
              await Product.updateOne(
                { _id: item.productId, stock: { $gte: item.quantity } },
                { $inc: { stock: -item.quantity } }
              );
            }
          }

          // Clear cart
          await Cart.deleteOne({ userId: order.userId });
        }
      }

      successResponse(res, {
        orderId,
        oldStatus,
        newStatus: payment.status,
        razorpayResponse: razorpayStatus
      }, 'Payment verified manually');
    } catch (error) {
      next(error);
    }
  },

  // Get payment statistics (Admin only)
  async getPaymentStats(req, res, next) {
    try {
      const { period = 'month' } = req.query;

      let dateFilter = {};
      const now = new Date();

      if (period === 'day') {
        dateFilter = {
          $gte: new Date(now.setHours(0, 0, 0, 0)),
          $lte: new Date(now.setHours(23, 59, 59, 999))
        };
      } else if (period === 'week') {
        const weekAgo = new Date(now.setDate(now.getDate() - 7));
        dateFilter = { $gte: weekAgo };
      } else if (period === 'month') {
        const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
        dateFilter = { $gte: monthAgo };
      }

      const stats = await Payment.aggregate([
        {
          $match: dateFilter ? { createdAt: dateFilter } : {}
        },
        {
          $group: {
            _id: {
              status: '$status',
              date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
            },
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' }
          }
        },
        {
          $sort: { '_id.date': -1 }
        }
      ]);

      // Summary stats
      const summary = await Payment.aggregate([
        {
          $match: dateFilter ? { createdAt: dateFilter } : {}
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' }
          }
        }
      ]);

      successResponse(res, {
        period,
        dailyStats: stats,
        summary
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = paymentController;