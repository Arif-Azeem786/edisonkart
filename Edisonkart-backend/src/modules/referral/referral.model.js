const mongoose = require('mongoose');

const loyaltySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  points: { type: Number, default: 0 },
  totalEarned: { type: Number, default: 0 },
  totalRedeemed: { type: Number, default: 0 },
  referralCode: { type: String, unique: true, sparse: true },
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  referrals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  history: [{
    type: { type: String, enum: ['earned', 'redeemed', 'referral_bonus', 'welcome_bonus', 'expired'] },
    points: Number,
    description: String,
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    createdAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

module.exports = mongoose.model('Loyalty', loyaltySchema);
