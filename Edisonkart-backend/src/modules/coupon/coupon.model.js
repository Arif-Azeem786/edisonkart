const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true,
  },
  description: { type: String, default: '' },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true,
  },
  discountValue: { type: Number, required: true, min: 0 },
  minOrderAmount: { type: Number, default: 0 },
  maxDiscount: { type: Number, default: null },
  usageLimit: { type: Number, default: null },
  usedCount: { type: Number, default: 0 },
  perUserLimit: { type: Number, default: 1 },
  usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isActive: { type: Boolean, default: true },
  expiresAt: { type: Date, default: null },
}, { timestamps: true });

couponSchema.methods.isValid = function (userId, orderTotal) {
  if (!this.isActive) return { valid: false, reason: 'Coupon is not active' };
  if (this.expiresAt && new Date() > this.expiresAt) return { valid: false, reason: 'Coupon has expired' };
  if (this.usageLimit && this.usedCount >= this.usageLimit) return { valid: false, reason: 'Coupon usage limit reached' };
  if (orderTotal < this.minOrderAmount) return { valid: false, reason: `Minimum order amount is ₹${this.minOrderAmount}` };

  if (userId && this.perUserLimit) {
    const userUsage = this.usedBy.filter(id => id.toString() === userId.toString()).length;
    if (userUsage >= this.perUserLimit) return { valid: false, reason: 'You have already used this coupon' };
  }

  return { valid: true };
};

couponSchema.methods.calculateDiscount = function (orderTotal) {
  let discount = 0;
  if (this.discountType === 'percentage') {
    discount = (orderTotal * this.discountValue) / 100;
    if (this.maxDiscount) discount = Math.min(discount, this.maxDiscount);
  } else {
    discount = this.discountValue;
  }
  return Math.min(Math.round(discount), orderTotal);
};

module.exports = mongoose.model('Coupon', couponSchema);
