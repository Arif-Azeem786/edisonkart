const Coupon = require('./coupon.model');
const { successResponse, errorResponse } = require('../../utils/responseFormatter');

const couponController = {
  async apply(req, res, next) {
    try {
      const { code } = req.body;
      if (!code) return errorResponse(res, 'Coupon code is required', 400);

      const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });
      if (!coupon) return errorResponse(res, 'Invalid coupon code', 404);

      const { subtotal = 0 } = req.body;
      const validation = coupon.isValid(req.user.userId, subtotal);
      if (!validation.valid) return errorResponse(res, validation.reason, 400);

      const discount = coupon.calculateDiscount(subtotal);

      successResponse(res, {
        couponId: coupon._id,
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discount,
        newTotal: Math.max(0, subtotal - discount),
      }, 'Coupon applied successfully');
    } catch (error) {
      next(error);
    }
  },

  async remove(req, res, next) {
    try {
      successResponse(res, { discount: 0 }, 'Coupon removed');
    } catch (error) {
      next(error);
    }
  },

  // Admin CRUD
  async getAll(req, res, next) {
    try {
      const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
      successResponse(res, coupons);
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const { code, description, discountType, discountValue, minOrderAmount, maxDiscount, usageLimit, perUserLimit, expiresAt, isActive } = req.body;
      if (!code || !discountType || discountValue == null) {
        return errorResponse(res, 'Code, discount type, and discount value are required', 400);
      }
      const exists = await Coupon.findOne({ code: code.toUpperCase().trim() });
      if (exists) return errorResponse(res, 'Coupon code already exists', 409);

      const coupon = await Coupon.create({
        code: code.toUpperCase().trim(),
        description, discountType, discountValue,
        minOrderAmount: minOrderAmount || 0,
        maxDiscount: maxDiscount || null,
        usageLimit: usageLimit || null,
        perUserLimit: perUserLimit || 1,
        expiresAt: expiresAt || null,
        isActive: isActive !== false,
      });

      successResponse(res, coupon, 'Coupon created', 201);
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
      if (!coupon) return errorResponse(res, 'Coupon not found', 404);
      successResponse(res, coupon, 'Coupon updated');
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const coupon = await Coupon.findByIdAndDelete(req.params.id);
      if (!coupon) return errorResponse(res, 'Coupon not found', 404);
      successResponse(res, null, 'Coupon deleted');
    } catch (error) {
      next(error);
    }
  },
};

module.exports = couponController;
