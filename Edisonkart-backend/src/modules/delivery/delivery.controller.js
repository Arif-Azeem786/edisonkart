const Order = require('../order/order.model');
const { successResponse, errorResponse } = require('../../utils/responseFormatter');

const deliveryController = {
  // Get assigned orders
  async getAssignedOrders(req, res, next) {
    try {
      const { status } = req.query;

      const query = {
        deliveryBoyId: req.user.userId,
        paymentStatus: 'PAID'
      };

      if (status) {
        query.orderStatus = status;
      }

      const orders = await Order.find(query)
        .populate('userId', 'name email phone')
        .sort({ updatedAt: -1 })
        .lean();

      successResponse(res, orders);
    } catch (error) {
      next(error);
    }
  },

  // Update delivery status
  async updateDeliveryStatus(req, res, next) {
    try {
      const { orderId } = req.params;
      const { status } = req.body;

      const validStatuses = ['CONFIRMED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];
      if (!validStatuses.includes(status)) {
        return errorResponse(res, 'Invalid delivery status', 400);
      }

      const order = await Order.findOne({
        orderId,
        deliveryBoyId: req.user.userId,
        paymentStatus: 'PAID'
      });

      if (!order) {
        return errorResponse(res, 'Order not found or not assigned to you', 404);
      }

      // Validate status flow
      const statusFlow = {
        'CONFIRMED': ['SHIPPED'],
        'SHIPPED': ['OUT_FOR_DELIVERY'],
        'OUT_FOR_DELIVERY': ['DELIVERED'],
        'DELIVERED': [] // Final state
      };

      if (!statusFlow[order.orderStatus]?.includes(status)) {
        return errorResponse(res, `Cannot change status from ${order.orderStatus} to ${status}`, 400);
      }

      order.orderStatus = status;
      if (status === 'DELIVERED') {
        order.deliveredAt = new Date();
      }
      
      order.statusHistory.push({
        status,
        timestamp: new Date(),
        comment: `Order status updated to ${status} by delivery partner`
      });
      await order.save();

      successResponse(res, order, `Order status updated to ${status}`);
    } catch (error) {
      next(error);
    }
  },

  // Get delivery stats
  async getStats(req, res, next) {
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const [
        totalAssigned,
        deliveredToday,
        outForDelivery,
        pendingCount,
        totalDelivered
      ] = await Promise.all([
        Order.countDocuments({
          deliveryBoyId: req.user.userId,
          paymentStatus: 'PAID'
        }),
        Order.countDocuments({
          deliveryBoyId: req.user.userId,
          orderStatus: 'DELIVERED',
          updatedAt: { $gte: todayStart }
        }),
        Order.countDocuments({
          deliveryBoyId: req.user.userId,
          orderStatus: 'OUT_FOR_DELIVERY'
        }),
        Order.countDocuments({
          deliveryBoyId: req.user.userId,
          paymentStatus: 'PAID',
          orderStatus: { $in: ['CONFIRMED', 'SHIPPED'] }
        }),
        Order.countDocuments({
          deliveryBoyId: req.user.userId,
          orderStatus: 'DELIVERED'
        })
      ]);

      successResponse(res, {
        totalAssigned,
        deliveredToday,
        outForDelivery,
        pendingCount,
        totalDelivered
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = deliveryController;