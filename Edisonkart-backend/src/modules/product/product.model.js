const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
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
    required: true
  },
  brand: {
    type: String,
    trim: true
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  imageIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductImages'
  }],
  videoIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductVideos'
  }],
  price: {
    type: Number,
    required: true,
    min: 0
  },
  discountPrice: {
    type: Number,
    min: 0,
    validate: {
      validator: function(value) {
        // During save(), `this` is the document
        if (this.price !== undefined) {
          return value <= this.price;
        }
        // During update queries, skip inline validation — handled by pre-hook
        return true;
      },
      message: 'Discount price cannot be greater than regular price'
    }
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  numReviews: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  isFlashSale: {
    type: Boolean,
    default: false
  },
  flashSaleEndTime: {
    type: Date
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Variant Support
  hasVariants: {
    type: Boolean,
    default: false
  },
  variantAttributes: [{
    name: { type: String, required: true },
    values: [{ type: String, required: true }]
  }],
  variants: [{
    sku: { type: String },
    attributes: {
      type: Map,
      of: String
    },
    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    imageIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductImages'
    }]
  }]
});

// Validate discountPrice during findOneAndUpdate
productSchema.pre('findOneAndUpdate', async function(next) {
  const update = this.getUpdate();
  const discountPrice = update.discountPrice ?? update.$set?.discountPrice;

  if (discountPrice !== undefined && discountPrice !== null) {
    // Get price from update payload or from existing document
    let price = update.price ?? update.$set?.price;
    if (price === undefined) {
      const doc = await this.model.findOne(this.getQuery()).select('price');
      price = doc?.price;
    }

    if (price !== undefined && Number(discountPrice) > Number(price)) {
      const error = new Error('Discount price cannot be greater than regular price');
      error.name = 'ValidationError';
      return next(error);
    }
  }

  // Update the updatedAt timestamp
  this.set({ updatedAt: Date.now() });
  next();
});

productSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for search
productSchema.index({ name: 'text', description: 'text' });

// Virtual for effective price
productSchema.virtual('effectivePrice').get(function() {
  return this.discountPrice || this.price;
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);