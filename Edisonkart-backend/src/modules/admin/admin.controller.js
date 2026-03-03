const Order = require('../order/order.model');
const Product = require('../product/product.model');
const User = require('../user/user.model');
const Category = require('../category/category.model');
const { successResponse, errorResponse } = require('../../utils/responseFormatter');

const adminController = {
  // Dashboard stats
  async getDashboardStats(req, res, next) {
    try {
      const query = {};
      const productQuery = { isActive: true };
      
      if (req.user.role === 'VENDOR') {
        query['items.vendorId'] = req.user.userId;
        productQuery.vendorId = req.user.userId;
      }

      const [
        totalOrders,
        totalProducts,
        totalUsers,
        totalRevenueResult,
        recentOrders
      ] = await Promise.all([
        Order.countDocuments(query),
        Product.countDocuments(productQuery),
        req.user.role === 'VENDOR' ? Promise.resolve(0) : User.countDocuments({ role: 'USER' }),
        Order.aggregate([
          {
            $match: {
              ...query,
              $or: [
                { paymentStatus: 'PAID', orderStatus: { $ne: 'CANCELLED' } },
                { orderStatus: 'DELIVERED' }
              ]
            }
          },
          { $unwind: '$items' },
          {
            $match: req.user.role === 'VENDOR' 
              ? { 'items.vendorId': req.user.userId }
              : {}
          },
          { 
            $group: { 
              _id: null, 
              total: { $sum: { $multiply: ['$items.priceSnapshot', '$items.quantity'] } } 
            } 
          }
        ]),
        Order.find(query)
          .sort({ createdAt: -1 })
          .limit(5)
          .populate('userId', 'name email')
          .lean()
      ]);

      successResponse(res, {
        stats: {
          totalOrders,
          totalProducts,
          totalUsers,
          totalRevenue: totalRevenueResult[0]?.total || 0
        },
        recentOrders
      });
    } catch (error) {
      next(error);
    }
  },

  // Get all orders with filters
  async getOrders(req, res, next) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        paymentStatus,
        startDate,
        endDate
      } = req.query;

      const query = {};

      // Vendor filtering
      if (req.user.role === 'VENDOR') {
        query['items.vendorId'] = req.user.userId;
      } else if (req.user.role === 'ADMIN' && req.query.vendorId) {
        query['items.vendorId'] = req.query.vendorId;
      }

      if (status) query.orderStatus = status;
      if (paymentStatus) query.paymentStatus = paymentStatus;
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      const skip = (page - 1) * limit;

      const orders = await Order.find(query)
        .populate('userId', 'name email')
        .populate('deliveryBoyId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean();

      const total = await Order.countDocuments(query);

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

  // Get all users
  async getUsers(req, res, next) {
    try {
      const { page = 1, limit = 20, role } = req.query;

      const query = {};
      if (role) query.role = role;

      const skip = (page - 1) * limit;

      const users = await User.find(query)
        .select('-password -otp -otpExpiry')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean();

      const total = await User.countDocuments(query);

      successResponse(res, {
        users,
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

  // Create delivery boy
  async createDeliveryBoy(req, res, next) {
    try {
      const { name, email, password } = req.body;

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return errorResponse(res, 'Email already exists', 400);
      }

      const deliveryBoy = await User.create({
        name,
        email,
        password,
        role: 'DELIVERY',
        isVerified: true
      });

      successResponse(res, deliveryBoy, 'Delivery boy created successfully', 201);
    } catch (error) {
      next(error);
    }
  },

  // Create employee (sub-admin with restricted frontend access)
  async createEmployee(req, res, next) {
    try {
      const { name, email, password } = req.body;

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return errorResponse(res, 'Email already exists', 400);
      }

      const employee = await User.create({
        name,
        email,
        password,
        role: 'EMPLOYEE',
        isVerified: true
      });

      successResponse(res, employee, 'Employee created successfully', 201);
    } catch (error) {
      next(error);
    }
  },

  // Create vendor/seller
  async createVendor(req, res, next) {
    try {
      const { name, email, password } = req.body;

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return errorResponse(res, 'Email already exists', 400);
      }

      const vendor = await User.create({
        name,
        email,
        password,
        role: 'VENDOR',
        isVerified: true
      });

      successResponse(res, vendor, 'Vendor created successfully', 201);
    } catch (error) {
      next(error);
    }
  },

  // Assign delivery boy to order
  async assignDeliveryBoy(req, res, next) {
    try {
      const { orderId } = req.params;
      const { deliveryBoyId } = req.body;

      const order = await Order.findOne({ orderId });

      if (!order) {
        return errorResponse(res, 'Order not found', 404);
      }

      // If vendor, check if they own any items in this order
      if (req.user.role === 'VENDOR') {
        const isVendorPart = order.items.some(item => 
          (item.vendorId?._id || item.vendorId)?.toString() === req.user.userId
        );
        if (!isVendorPart) {
          return errorResponse(res, 'Access denied. You do not have products in this order.', 403);
        }
      }

      order.deliveryBoyId = deliveryBoyId;

      // Only advance to CONFIRMED if the order is still in PLACED state
      if (order.orderStatus === 'PLACED') {
        order.orderStatus = 'CONFIRMED';
        order.statusHistory.push({
          status: 'CONFIRMED',
          timestamp: new Date(),
          comment: 'Delivery partner assigned, order confirmed'
        });
      } else {
        order.statusHistory.push({
          status: order.orderStatus,
          timestamp: new Date(),
          comment: 'Delivery partner reassigned'
        });
      }

      await order.save();

      successResponse(res, order, 'Delivery boy assigned successfully');
    } catch (error) {
      next(error);
    }
  },

  // Get low stock products
  async getLowStockProducts(req, res, next) {
    try {
      const { threshold = 10 } = req.query;

      const products = await Product.find({
        stock: { $lte: Number(threshold) },
        isActive: true
      })
        .populate('categoryId', 'name')
        .sort({ stock: 1 })
        .lean();

      successResponse(res, products);
    } catch (error) {
      next(error);
    }
  }
};

module.exports = adminController;