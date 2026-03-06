const Order = require('./order.model');
const Cart = require('../cart/cart.model');
const Product = require('../product/product.model');
const Payment = require('../payment/payment.model');
const User = require('../user/user.model');
const razorpayService = require('../../config/razorpay');

// Fail fast if Razorpay config wasn't deployed correctly (e.g. server still on Cashfree)
if (typeof razorpayService?.createOrder !== 'function') {
  throw new Error(
    'Razorpay config invalid: createOrder is not a function. ' +
    'Ensure Edisonkart-backend/src/config/razorpay.js exists on the server and exports a RazorpayService instance.'
  );
}
const generateOrderId = require('../../utils/generateOrderId');
const emailService = require('../../utils/emailService');
const { successResponse, errorResponse } = require('../../utils/responseFormatter');
const { generateInvoice } = require('../../utils/invoiceGenerator');
const mongoose = require('mongoose');

const orderController = {
  // Create order (checkout)
  async createOrder(req, res, next) {
    try {
      const { addressId, buyNowItem } = req.body;

      let orderItems = [];
      let totalAmount = 0;

      if (buyNowItem && buyNowItem.productId && buyNowItem.quantity) {
        // Buy Now flow — single product, bypass cart
        const product = await Product.findById(buyNowItem.productId);
        if (!product || !product.isActive) {
          return errorResponse(res, 'Product is not available', 400);
        }

        let price = product.discountPrice || product.price;
        let variantAttributesSnapshot = null;

        if (buyNowItem.variantId && product.hasVariants) {
          const variant = product.variants.id(buyNowItem.variantId);
          if (!variant) {
            return errorResponse(res, 'Product variant not found', 404);
          }
          if (variant.stock < buyNowItem.quantity) {
            return errorResponse(res, `Insufficient stock for ${product.name} variant`, 400);
          }
          price = variant.discountPrice || variant.price;
          variantAttributesSnapshot = variant.attributes;
        } else if (product.stock < buyNowItem.quantity) {
          return errorResponse(res, `Insufficient stock for ${product.name}`, 400);
        }

        totalAmount = price * buyNowItem.quantity;

        orderItems.push({
          productId: product._id,
          variantId: buyNowItem.variantId || null,
          variantAttributesSnapshot,
          nameSnapshot: product.name,
          priceSnapshot: price,
          quantity: buyNowItem.quantity,
          vendorId: product.vendorId
        });
      } else {
        // Standard cart-based checkout
        const cart = await Cart.findOne({ userId: req.user.userId }).populate('items.productId');
        if (!cart || cart.items.length === 0) {
          return errorResponse(res, 'Cart is empty', 400);
        }

        for (const item of cart.items) {
          const product = item.productId;

          if (!product || !product.isActive) {
            throw new Error(`Product ${item.productId} is not available`);
          }

          let price = product.discountPrice || product.price;
          let stock = product.stock;
          let variantAttributesSnapshot = null;

          if (item.variantId && product.hasVariants) {
            const variant = product.variants.id(item.variantId);
            if (variant) {
              price = variant.discountPrice || variant.price;
              stock = variant.stock;
              variantAttributesSnapshot = variant.attributes;
            }
          }

          if (stock < item.quantity) {
            throw new Error(`Insufficient stock for ${product.name}`);
          }

          totalAmount += price * item.quantity;

          orderItems.push({
            productId: product._id,
            variantId: item.variantId || null,
            variantAttributesSnapshot,
            nameSnapshot: product.name,
            priceSnapshot: price,
            quantity: item.quantity,
            vendorId: product.vendorId
          });
        }
      }

      // Get user with address
      const user = await User.findById(req.user.userId);
      const address = user.addresses.id(addressId);
      if (!address) {
        return errorResponse(res, 'Address not found', 400);
      }

      const phone = address.phone?.replace(/\D/g, '');
      if (!phone || phone.length < 10) {
        return errorResponse(res, 'Please update your phone number in your address. A valid 10-digit phone number is required for payment.', 400);
      }

      const orderId = generateOrderId();
      const { paymentMethod } = req.body;

      if (paymentMethod === 'cod') {
        const Settings = require('../settings/settings.model');
        const codAllowed = await Settings.get('codEnabled', false);
        if (!codAllowed) {
          return errorResponse(res, 'Cash on Delivery is not available at this time.', 400);
        }

        // Reduce stock for COD orders
        for (const item of orderItems) {
          if (item.variantId) {
            await Product.updateOne(
              { _id: item.productId, 'variants._id': item.variantId, 'variants.stock': { $gte: item.quantity } },
              { $inc: { 'variants.$.stock': -item.quantity } }
            );
          } else {
            await Product.updateOne(
              { _id: item.productId, stock: { $gte: item.quantity } },
              { $inc: { stock: -item.quantity } }
            );
          }
        }

        // Clear user cart
        await Cart.deleteOne({ userId: req.user.userId });

        const order = await Order.create({
          orderId,
          userId: req.user.userId,
          items: orderItems,
          totalAmount,
          paymentMethod: 'cod',
          statusHistory: [{
            status: 'PLACED',
            timestamp: new Date(),
            comment: 'COD order placed successfully'
          }],
          addressSnapshot: {
            name: address.name,
            phone: address.phone,
            addressLine1: address.addressLine1,
            addressLine2: address.addressLine2,
            city: address.city,
            state: address.state,
            pincode: address.pincode
          }
        });

        await Payment.create({
          orderId,
          gatewayOrderId: `COD-${orderId}`,
          amount: totalAmount,
          status: 'COD_PENDING'
        });

        // Send COD order confirmation email & notification
        try {
          const orderUser = await User.findById(req.user.userId);
          if (orderUser?.email) {
            emailService.sendOrderConfirmation(orderUser.email, { orderId, totalAmount, items: orderItems }).catch(() => {});
          }
          const { createNotification } = require('../notification/notification.controller');
          createNotification({ userId: req.user.userId, type: 'order_placed', title: 'Order Placed!', message: `Your COD order #${orderId} has been placed. Pay ₹${Math.round(totalAmount).toLocaleString('en-IN')} on delivery.`, link: `/orders/${orderId}` }).catch(() => {});
        } catch (_) {}

        return successResponse(res, {
          orderId,
          amount: totalAmount,
          paymentMethod: 'cod',
        }, 'COD order placed successfully');
      }

      let razorpayOrder;
      try {
        razorpayOrder = await razorpayService.createOrder({
          orderId,
          amount: totalAmount,
          customerName: user.name,
          customerEmail: user.email,
          customerPhone: phone.slice(-10)
        });
      } catch (paymentError) {
        return errorResponse(res, paymentError.message || 'Payment gateway error. Please try again.', 400);
      }

      const order = await Order.create({
        orderId,
        userId: req.user.userId,
        items: orderItems,
        totalAmount,
        statusHistory: [{
          status: 'PLACED',
          timestamp: new Date(),
          comment: 'Order placed successfully'
        }],
        addressSnapshot: {
          name: address.name,
          phone: address.phone,
          addressLine1: address.addressLine1,
          addressLine2: address.addressLine2,
          city: address.city,
          state: address.state,
          pincode: address.pincode
        }
      });

      await Payment.create({
        orderId,
        gatewayOrderId: razorpayOrder.id,
        amount: totalAmount,
        status: 'PENDING'
      });

      successResponse(res, {
        orderId,
        razorpayOrderId: razorpayOrder.id,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
        paymentSessionId: razorpayOrder.id,
        amount: totalAmount
      }, 'Order created successfully');
    } catch (error) {
      next(error);
    }
  },

  // Razorpay payment verification handler (expects data from frontend after successful payment)
  async handleWebhook(req, res, next) {
    try {
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      } = req.body;

      // If required fields are missing, do not throw hard 401 to avoid UI errors.
      // Just acknowledge the request and let frontend handle the failure state.
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return successResponse(res, { verified: false }, 'Invalid or incomplete payment data');
      }

      const isValid = razorpayService.verifyPaymentSignature({
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature
      });

      if (!isValid) {
        // Do not respond with 401 to avoid visible client errors; report as unverified instead.
        return successResponse(res, { verified: false }, 'Invalid payment signature');
      }

      // Find payment record
      const payment = await Payment.findOne({ gatewayOrderId: razorpay_order_id });
      if (!payment) {
        return errorResponse(res, 'Payment not found', 404);
      }

      // Update payment status
      payment.status = 'SUCCESS';
      payment.rawResponse = req.body;
      await payment.save();

      if (payment.status === 'SUCCESS') {
        // Update order payment status — only if not already processed (idempotency guard)
        const order = await Order.findOne({ orderId: payment.orderId });
        if (order && order.paymentStatus !== 'PAID') {
          order.paymentStatus = 'PAID';
          // Auto-confirm order if paid
          if (order.orderStatus === 'PLACED') {
            order.orderStatus = 'CONFIRMED';
            order.statusHistory.push({
              status: 'CONFIRMED',
              timestamp: new Date(),
              comment: 'Payment successful, order confirmed'
            });
          }
          await order.save();

          // Reduce stock
          for (const item of order.items) {
            if (item.variantId) {
                await Product.updateOne(
                  { _id: item.productId, "variants._id": item.variantId },
                  { $inc: { "variants.$.stock": -item.quantity } }
                );
            } else {
                await Product.updateOne(
                  { _id: item.productId, stock: { $gte: item.quantity } },
                  { $inc: { stock: -item.quantity } }
                );
            }
          }

          // Clear user cart
          await Cart.deleteOne({ userId: order.userId });

          // Send confirmation email & in-app notification
          const user = await User.findById(order.userId);
          if (user) {
            emailService.sendOrderConfirmation(user.email, order).catch(() => {});
            const { createNotification } = require('../notification/notification.controller');
            createNotification({ userId: order.userId, type: 'order_confirmed', title: 'Order Confirmed!', message: `Payment received for order #${order.orderId}. We're processing it now.`, link: `/orders/${order.orderId}` }).catch(() => {});
          }
        }
      }

      res.status(200).json({ status: 'OK' });
    } catch (error) {
      next(error);
    }
  },

  // Get order by ID
  async getOrder(req, res, next) {
    try {
      const { orderId } = req.params;

      const order = await Order.findOne({ orderId })
        .populate('userId', 'name email')
        .populate({
          path: 'items.productId',
          select: 'name slug imageIds description categoryId hasVariants variants variantAttributes'
        })
        .lean();

      if (!order) {
        return errorResponse(res, 'Order not found', 404);
      }

      // Check if user owns the order or is admin/delivery/vendor
      const isOwner = order.userId._id.toString() === req.user.userId;
      const isAdminOrDelivery = ['ADMIN', 'DELIVERY'].includes(req.user.role);
      const isVendorPart = req.user.role === 'VENDOR' && order.items.some(item => 
        (item.vendorId?._id || item.vendorId)?.toString() === req.user.userId
      );

      if (!isOwner && !isAdminOrDelivery && !isVendorPart) {
        return errorResponse(res, 'Access denied', 403);
      }

      // Get payment status
      const payment = await Payment.findOne({ orderId }).lean();
      order.payment = payment;

      successResponse(res, order);
    } catch (error) {
      next(error);
    }
  },

  // Get user orders
  async getUserOrders(req, res, next) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const skip = (page - 1) * limit;

      const orders = await Order.find({ userId: req.user.userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean();

      const total = await Order.countDocuments({ userId: req.user.userId });

      successResponse(res, {
        orders,
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

  // Update order status (Admin only)
  async updateOrderStatus(req, res, next) {
    try {
      const { orderId } = req.params;
      const { status, deliveryBoyId } = req.body;

      const orderToFind = await Order.findOne({ orderId });
      if (!orderToFind) {
        return errorResponse(res, 'Order not found', 404);
      }

      // If vendor, check if they own any items in this order
      if (req.user.role === 'VENDOR') {
        const isVendorPart = orderToFind.items.some(item => 
          (item.vendorId?._id || item.vendorId)?.toString() === req.user.userId
        );
        if (!isVendorPart) {
          return errorResponse(res, 'Access denied. You do not have products in this order.', 403);
        }
      }

      const updateData = { orderStatus: status };
      if (deliveryBoyId) {
        updateData.deliveryBoyId = deliveryBoyId;
      }
      if (req.body.estimatedDeliveryDate) {
        updateData.estimatedDeliveryDate = req.body.estimatedDeliveryDate;
      }

      const order = await Order.findOneAndUpdate(
        { orderId },
        { 
          ...updateData,
          $push: {
            statusHistory: {
              status: status,
              timestamp: new Date(),
              comment: `Order status updated to ${status}`
            }
          }
        },
        { new: true, runValidators: true }
      );

      if (!order) {
        return errorResponse(res, 'Order not found', 404);
      }

      // Send email & in-app notification for key status changes
      try {
        const user = await User.findById(order.userId);
        if (user?.email && ['SHIPPED', 'DELIVERED', 'OUT_FOR_DELIVERY'].includes(status)) {
          emailService.sendOrderUpdate(user.email, order, status).catch(() => {});
        }
        const { createNotification } = require('../notification/notification.controller');
        const notifMap = {
          CONFIRMED: { type: 'order_confirmed', title: 'Order Confirmed', message: `Your order #${order.orderId} has been confirmed.` },
          SHIPPED: { type: 'order_shipped', title: 'Order Shipped', message: `Your order #${order.orderId} has been shipped!` },
          OUT_FOR_DELIVERY: { type: 'order_shipped', title: 'Out for Delivery', message: `Your order #${order.orderId} is out for delivery.` },
          DELIVERED: { type: 'order_delivered', title: 'Order Delivered', message: `Your order #${order.orderId} has been delivered. Enjoy!` },
        };
        if (notifMap[status]) {
          createNotification({ userId: order.userId, type: notifMap[status].type, title: notifMap[status].title, message: notifMap[status].message, link: `/orders/${order.orderId}` }).catch(() => {});
        }
      } catch (_) {}

      successResponse(res, order, 'Order status updated');
    } catch (error) {
      next(error);
    }
  },

  // Cancel order (User)
  async cancelOrder(req, res, next) {
    try {
      const { orderId } = req.params;
      const { reason } = req.body;

      const order = await Order.findOne({ orderId, userId: req.user.userId });
      if (!order) {
        return errorResponse(res, 'Order not found', 404);
      }

      const cancellableStatuses = ['PLACED', 'CONFIRMED'];
      if (!cancellableStatuses.includes(order.orderStatus)) {
        return errorResponse(res, `Cannot cancel order in ${order.orderStatus} status`, 400);
      }

      order.orderStatus = 'CANCELLED';
      order.statusHistory.push({
        status: 'CANCELLED',
        timestamp: new Date(),
        comment: reason ? `Cancelled by user: ${reason}` : 'Cancelled by user'
      });

      // Restock items
      for (const item of order.items) {
        if (item.variantId) {
          await Product.updateOne(
            { _id: item.productId, "variants._id": item.variantId },
            { $inc: { "variants.$.stock": item.quantity } }
          );
        } else {
          await Product.updateOne(
            { _id: item.productId },
            { $inc: { stock: item.quantity } }
          );
        }
      }

      await order.save();

      // Send cancellation email
      const user = await User.findById(req.user.userId);
      if (user) await emailService.sendOrderUpdate(user.email, order, 'CANCELLED');

      successResponse(res, order, 'Order cancelled successfully');
    } catch (error) {
      next(error);
    }
  },

  // Request Return/Replacement (User)
  async requestReturn(req, res, next) {
    try {
      const { orderId } = req.params;
      const { type, reason } = req.body; // type: 'RETURN' or 'REPLACEMENT'

      if (!['RETURN', 'REPLACEMENT'].includes(type)) {
        return errorResponse(res, 'Invalid return type', 400);
      }

      const order = await Order.findOne({ orderId, userId: req.user.userId });
      if (!order) {
        return errorResponse(res, 'Order not found', 404);
      }

      if (order.orderStatus !== 'DELIVERED') {
        return errorResponse(res, 'Only delivered orders can be returned', 400);
      }

      // Check return window (7 days)
      const deliveryDate = order.deliveredAt || order.updatedAt; // Fallback to updatedAt if deliveredAt not explicitly set
      const diffTime = Math.abs(new Date() - new Date(deliveryDate));
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 7) {
        return errorResponse(res, 'Return window (7 days) has expired', 400);
      }

      const newStatus = type === 'RETURN' ? 'RETURN_REQUESTED' : 'REPLACEMENT_REQUESTED';
      order.orderStatus = newStatus;
      order.returnReason = reason;
      order.statusHistory.push({
        status: newStatus,
        timestamp: new Date(),
        comment: `Return/Replacement requested: ${reason}`
      });

      await order.save();
      successResponse(res, order, `${type} request submitted successfully`);
    } catch (error) {
      next(error);
    }
  },

  // Download Invoice (Public/User/Admin)
  async downloadInvoice(req, res, next) {
    try {
      const { orderId } = req.params;

      const order = await Order.findOne({ orderId });
      if (!order) {
        return errorResponse(res, 'Order not found', 404);
      }

      // Authorization check (owner, admin, or vendor part of order)
      const isOwner = order.userId.toString() === req.user.userId;
      const isAdmin = req.user.role === 'ADMIN';
      const isVendorPart = req.user.role === 'VENDOR' && order.items.some(item => 
        (item.vendorId?._id || item.vendorId)?.toString() === req.user.userId
      );

      if (!isOwner && !isAdmin && !isVendorPart) {
        return errorResponse(res, 'Access denied', 403);
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=invoice_${orderId}.pdf`);

      generateInvoice(order, res);
    } catch (error) {
      next(error);
    }
  },

  async getReturnRequests(req, res, next) {
    try {
      const orders = await Order.find({
        orderStatus: { $in: ['RETURN_REQUESTED', 'REPLACEMENT_REQUESTED'] }
      }).sort({ updatedAt: -1 }).populate('userId', 'name email').lean();

      successResponse(res, orders);
    } catch (error) {
      next(error);
    }
  },

  async approveReturn(req, res, next) {
    try {
      const { orderId } = req.params;
      const { action, comment } = req.body;

      const order = await Order.findOne({ orderId });
      if (!order) return errorResponse(res, 'Order not found', 404);

      if (!['RETURN_REQUESTED', 'REPLACEMENT_REQUESTED'].includes(order.orderStatus)) {
        return errorResponse(res, 'No return/replacement request pending for this order', 400);
      }

      if (action === 'approve') {
        const newStatus = order.orderStatus === 'RETURN_REQUESTED' ? 'RETURNED' : 'REPLACED';
        order.orderStatus = newStatus;
        order.statusHistory.push({
          status: newStatus,
          comment: comment || 'Return/replacement approved by admin',
          changedBy: req.user.userId,
        });

        if (order.orderStatus === 'RETURNED') {
          for (const item of order.items) {
            if (item.variantId) {
              await Product.updateOne(
                { _id: item.productId, 'variants._id': item.variantId },
                { $inc: { 'variants.$.stock': item.quantity } }
              );
            } else {
              await Product.updateOne(
                { _id: item.productId },
                { $inc: { stock: item.quantity } }
              );
            }
          }
        }
      } else if (action === 'reject') {
        order.orderStatus = 'DELIVERED';
        order.statusHistory.push({
          status: 'DELIVERED',
          comment: comment || 'Return/replacement request rejected by admin',
          changedBy: req.user.userId,
        });
      } else {
        return errorResponse(res, 'Action must be "approve" or "reject"', 400);
      }

      await order.save();
      successResponse(res, order, `Return ${action}d successfully`);
    } catch (error) {
      next(error);
    }
  },
};

module.exports = orderController;