const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    default: ''
  },
  icon: {
    type: String,   // emoji or icon identifier
    default: ''
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null   // null = top-level main category
  },
  level: {
    type: Number,
    default: 1,     // 1 = main, 2 = subcategory, 3 = product type
    min: 1,
    max: 3
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

categorySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for fast parent + subcategory lookups
categorySchema.index({ parent: 1, level: 1 });

module.exports = mongoose.model('Category', categorySchema);
