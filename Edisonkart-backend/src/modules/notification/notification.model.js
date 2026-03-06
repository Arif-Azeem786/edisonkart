const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: {
    type: String,
    enum: ['order_placed', 'order_confirmed', 'order_shipped', 'order_delivered', 'order_cancelled',
           'return_approved', 'return_rejected', 'refund_processed', 'price_drop', 'flash_sale',
           'promo', 'welcome', 'general'],
    default: 'general',
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  link: { type: String, default: null },
  read: { type: Boolean, default: false, index: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
