const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  priceSnapshot: {
    type: Number,
    required: true
  },
  variantId: {
    type: mongoose.Schema.Types.ObjectId
  }
}, { _id: true });

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [cartItemSchema],
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

cartSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Calculate total
cartSchema.methods.getTotal = function() {
  return this.items.reduce((total, item) => {
    return total + (item.priceSnapshot * item.quantity);
  }, 0);
};

module.exports = mongoose.model('Cart', cartSchema);