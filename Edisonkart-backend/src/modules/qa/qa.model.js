const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true, maxlength: 1000 },
  helpful: { type: Number, default: 0 },
}, { timestamps: true });

const questionSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true, maxlength: 500 },
  answers: [answerSchema],
}, { timestamps: true });

questionSchema.index({ productId: 1, createdAt: -1 });

module.exports = mongoose.model('Question', questionSchema);
