const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  nameSnapshot: {
    type: String,
    required: true
  },
  priceSnapshot: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  variantId: {
    type: mongoose.Schema.Types.ObjectId
  },
  variantAttributesSnapshot: {
    type: Map,
    of: String
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { _id: true });

const addressSnapshotSchema = new mongoose.Schema({
  name: String,
  phone: String,
  addressLine1: String,
  addressLine2: String,
  city: String,
  state: String,
  pincode: String
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['razorpay', 'cod'],
    default: 'razorpay'
  },
  paymentStatus: {
    type: String,
    enum: ['PENDING', 'PAID', 'FAILED', 'COD_PENDING'],
    default: 'PENDING'
  },
  orderStatus: {
    type: String,
    enum: ['PLACED', 'CONFIRMED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'RETURN_REQUESTED', 'RETURNED', 'REPLACEMENT_REQUESTED', 'REPLACED'],
    default: 'PLACED'
  },
  statusHistory: [{
    status: {
      type: String,
      enum: ['PLACED', 'CONFIRMED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'RETURN_REQUESTED', 'RETURNED', 'REPLACEMENT_REQUESTED', 'REPLACED'],
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    comment: String
  }],
  deliveryBoyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  addressSnapshot: addressSnapshotSchema,
  
  // New Fields for Return/Replacement/Serviceability
  returnReason: String,
  returnStatus: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING'
  },
  replacementStatus: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING'
  },
  refundStatus: {
    type: String,
    enum: ['PENDING', 'COMPLETED', 'FAILED'],
    default: 'PENDING'
  },
  estimatedDeliveryDate: Date,
  deliveredAt: Date,
  returnedAt: Date,

  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

orderSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Order', orderSchema);