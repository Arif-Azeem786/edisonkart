const User = require('./user.model');
const { successResponse, errorResponse } = require('../../utils/responseFormatter');

const userController = {
  // Get user profile
  async getProfile(req, res, next) {
    try {
      const user = await User.findById(req.user.userId).select('-password -otp -otpExpiry');
      if (!user) {
        return errorResponse(res, 'User not found', 404);
      }

      successResponse(res, user);
    } catch (error) {
      next(error);
    }
  },

  // Update profile
  async updateProfile(req, res, next) {
    try {
      const { name, phone, gender, dob } = req.body;

      const user = await User.findByIdAndUpdate(
        req.user.userId,
        { name, phone, gender, dob },
        { new: true, runValidators: true }
      ).select('-password -otp -otpExpiry');

      successResponse(res, user, 'Profile updated successfully');
    } catch (error) {
      next(error);
    }
  },

  // Upload Avatar
  async uploadAvatar(req, res, next) {
    try {
      if (!req.file) {
        return errorResponse(res, 'No file uploaded', 400);
      }

      const user = await User.findById(req.user.userId);
      if (!user) {
        return errorResponse(res, 'User not found', 404);
      }

      const { deleteImage } = require('../../config/gridfs');

      // Delete old avatar if exists
      if (user.avatar) {
        try {
          await deleteImage(user.avatar);
        } catch (err) {
          console.error('Failed to delete old avatar:', err);
        }
      }

      user.avatar = req.file.id;
      await user.save();

      const updatedUser = await User.findById(req.user.userId).select('-password -otp -otpExpiry');
      successResponse(res, updatedUser, 'Profile picture updated successfully');
    } catch (error) {
      next(error);
    }
  },

  // Get Avatar
  async getAvatar(req, res, next) {
    try {
      const { imageId } = req.params;
      const mongoose = require('mongoose');
      const { getImageStream, getImageInfo } = require('../../config/gridfs');

      if (!mongoose.Types.ObjectId.isValid(imageId)) {
        return errorResponse(res, 'Invalid image ID', 400);
      }

      const imageInfo = await getImageInfo(new mongoose.Types.ObjectId(imageId));
      if (!imageInfo) {
        return errorResponse(res, 'Image not found', 404);
      }

      res.set('Content-Type', imageInfo.contentType);
      res.set('Content-Length', imageInfo.length);

      const stream = getImageStream(new mongoose.Types.ObjectId(imageId));
      stream.pipe(res);
    } catch (error) {
      next(error);
    }
  },

  // Add address
  async addAddress(req, res, next) {
    try {
      const user = await User.findById(req.user.userId);

      // If this is first address, make it default
      if (user.addresses.length === 0) {
        req.body.isDefault = true;
      }

      // If new address is default, unset others
      if (req.body.isDefault) {
        user.addresses.forEach(addr => addr.isDefault = false);
      }

      user.addresses.push(req.body);
      await user.save();

      successResponse(res, user.addresses, 'Address added successfully');
    } catch (error) {
      next(error);
    }
  },

  // Update address
  async updateAddress(req, res, next) {
    try {
      const { addressId } = req.params;
      const user = await User.findById(req.user.userId);

      const address = user.addresses.id(addressId);
      if (!address) {
        return errorResponse(res, 'Address not found', 404);
      }

      // If setting as default, unset others
      if (req.body.isDefault) {
        user.addresses.forEach(addr => addr.isDefault = false);
      }

      Object.assign(address, req.body);
      await user.save();

      successResponse(res, user.addresses, 'Address updated successfully');
    } catch (error) {
      next(error);
    }
  },

  // Delete address
  async deleteAddress(req, res, next) {
    try {
      const { addressId } = req.params;
      const user = await User.findById(req.user.userId);

      user.addresses.pull(addressId);

      // If deleted address was default, set another as default
      if (user.addresses.length > 0 && !user.addresses.some(addr => addr.isDefault)) {
        user.addresses[0].isDefault = true;
      }

      await user.save();

      successResponse(res, user.addresses, 'Address deleted successfully');
    } catch (error) {
      next(error);
    }
  },

  // Get order history
  async getOrderHistory(req, res, next) {
    try {
      const Order = require('../order/order.model');

      const orders = await Order.find({ userId: req.user.userId })
        .sort({ createdAt: -1 })
        .lean();

      successResponse(res, orders);
    } catch (error) {
      next(error);
    }
  }
};

module.exports = userController;