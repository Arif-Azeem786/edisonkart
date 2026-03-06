const Notification = require('./notification.model');
const { successResponse, errorResponse } = require('../../utils/responseFormatter');

async function createNotification({ userId, type, title, message, link, metadata }) {
  try {
    return await Notification.create({ userId, type, title, message, link, metadata });
  } catch (err) {
    console.error('Failed to create notification:', err.message);
    return null;
  }
}

const notificationController = {
  async getAll(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;

      const [notifications, total, unreadCount] = await Promise.all([
        Notification.find({ userId: req.user.userId })
          .sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        Notification.countDocuments({ userId: req.user.userId }),
        Notification.countDocuments({ userId: req.user.userId, read: false }),
      ]);

      successResponse(res, { notifications, total, unreadCount, page, totalPages: Math.ceil(total / limit) });
    } catch (error) {
      next(error);
    }
  },

  async getUnreadCount(req, res, next) {
    try {
      const count = await Notification.countDocuments({ userId: req.user.userId, read: false });
      successResponse(res, { unreadCount: count });
    } catch (error) {
      next(error);
    }
  },

  async markAsRead(req, res, next) {
    try {
      const { id } = req.params;
      await Notification.findOneAndUpdate({ _id: id, userId: req.user.userId }, { read: true });
      successResponse(res, null, 'Marked as read');
    } catch (error) {
      next(error);
    }
  },

  async markAllAsRead(req, res, next) {
    try {
      await Notification.updateMany({ userId: req.user.userId, read: false }, { read: true });
      successResponse(res, null, 'All notifications marked as read');
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      await Notification.findOneAndDelete({ _id: req.params.id, userId: req.user.userId });
      successResponse(res, null, 'Notification deleted');
    } catch (error) {
      next(error);
    }
  },
};

module.exports = { notificationController, createNotification };
