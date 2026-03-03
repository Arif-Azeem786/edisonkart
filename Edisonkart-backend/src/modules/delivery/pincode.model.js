const mongoose = require('mongoose');

const pincodeSchema = new mongoose.Schema({
  pincode: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  estimatedDays: {
    type: Number,
    required: true,
    default: 3
  },
  area: String,
  city: String,
  state: String,
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

pincodeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Pincode', pincodeSchema);
