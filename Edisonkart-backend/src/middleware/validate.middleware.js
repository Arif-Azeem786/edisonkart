const Joi = require('joi');

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    const messages = error.details.map(d => d.message).join(', ');
    return res.status(400).json({ success: false, message: messages });
  }
  next();
};

// Reusable schemas
const schemas = {
  addCartItem: Joi.object({
    productId: Joi.string().required(),
    variantId: Joi.string().allow(null, ''),
    quantity: Joi.number().integer().min(1).default(1),
  }),
  updateCartItem: Joi.object({
    quantity: Joi.number().integer().min(1).required(),
  }),
  createReview: Joi.object({
    productId: Joi.string().required(),
    rating: Joi.number().min(1).max(5).required(),
    comment: Joi.string().max(2000).allow(''),
  }),
  submitContact: Joi.object({
    name: Joi.string().min(1).max(100).required(),
    email: Joi.string().email().required(),
    subject: Joi.string().min(1).max(200).required(),
    message: Joi.string().min(1).max(5000).required(),
  }),
  addAddress: Joi.object({
    name: Joi.string().max(100).allow(''),
    phone: Joi.string().max(20).allow(''),
    addressLine1: Joi.string().max(300).allow(''),
    street: Joi.string().max(300).allow(''),
    city: Joi.string().max(100).allow(''),
    state: Joi.string().max(100).allow(''),
    pincode: Joi.string().max(10).allow(''),
    type: Joi.string().max(20).allow(''),
  }),
  applyCoupon: Joi.object({
    code: Joi.string().required(),
    subtotal: Joi.number().min(0).default(0),
  }),
  checkPincode: Joi.object({
    pincode: Joi.string().pattern(/^\d{6}$/).required(),
  }),
  createCoupon: Joi.object({
    code: Joi.string().min(3).max(30).required(),
    description: Joi.string().max(200).allow(''),
    discountType: Joi.string().valid('percentage', 'fixed').required(),
    discountValue: Joi.number().min(0).required(),
    minOrderAmount: Joi.number().min(0).default(0),
    maxDiscount: Joi.number().min(0).allow(null),
    usageLimit: Joi.number().integer().min(1).allow(null),
    perUserLimit: Joi.number().integer().min(1).default(1),
    expiresAt: Joi.date().allow(null),
    isActive: Joi.boolean().default(true),
  }),
  askQuestion: Joi.object({
    productId: Joi.string().required(),
    text: Joi.string().min(3).max(500).required(),
  }),
  answerQuestion: Joi.object({
    text: Joi.string().min(1).max(1000).required(),
  }),
};

// Default export is the validate function for backwards compatibility
module.exports = validate;
module.exports.validate = validate;
module.exports.schemas = schemas;
