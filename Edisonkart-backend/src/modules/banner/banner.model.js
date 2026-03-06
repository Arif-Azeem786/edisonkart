const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  subtitle: { type: String, trim: true },
  imageId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductImages' },
  backgroundColor: { type: String, default: '#1E3A8A' },
  linkType: { type: String, enum: ['category', 'product', 'url', 'flash-sale'], default: 'url' },
  linkValue: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

bannerSchema.pre('save', function(next) { this.updatedAt = Date.now(); next(); });
bannerSchema.pre('findOneAndUpdate', function(next) { this.set({ updatedAt: Date.now() }); next(); });

module.exports = mongoose.model('Banner', bannerSchema);
