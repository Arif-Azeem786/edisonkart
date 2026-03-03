const Pincode = require('../delivery/pincode.model');
const { successResponse, errorResponse } = require('../../utils/responseFormatter');

const serviceabilityController = {
  // Check pincode serviceability
  async checkPincode(req, res, next) {
    try {
      const { pincode } = req.params;

      if (!pincode || pincode.length !== 6) {
        return errorResponse(res, 'Please enter a valid 6-digit pincode', 400);
      }

      const pData = await Pincode.findOne({ pincode, isAvailable: true });

      if (!pData) {
        return successResponse(res, {
          available: false,
          message: 'Currently not serving this location'
        });
      }

      // Calculate estimated delivery date
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + pData.estimatedDays);

      successResponse(res, {
        available: true,
        estimatedDays: pData.estimatedDays,
        estimatedDate: deliveryDate,
        city: pData.city,
        state: pData.state,
        message: `Delivery by ${deliveryDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}`
      });
    } catch (error) {
      next(error);
    }
  },

  // Admin: Add or update pincode
  async updatePincode(req, res, next) {
    try {
      const { pincode, isAvailable, estimatedDays, area, city, state } = req.body;

      const pData = await Pincode.findOneAndUpdate(
        { pincode },
        { isAvailable, estimatedDays, area, city, state },
        { upsert: true, new: true, runValidators: true }
      );

      successResponse(res, pData, 'Pincode updated successfully');
    } catch (error) {
      next(error);
    }
  }
};

module.exports = serviceabilityController;
