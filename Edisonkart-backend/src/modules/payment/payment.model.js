const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    ref: 'Order'
  },
  gatewayOrderId: {
    type: String,
    required: true
  },
  transactionId: String,
  status: {
    type: String,
    enum: ['PENDING', 'SUCCESS', 'FAILED', 'COD_PENDING'],
    default: 'PENDING'
  },
  amount: Number,
  rawResponse: mongoose.Schema.Types.Mixed,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Payment', paymentSchema);