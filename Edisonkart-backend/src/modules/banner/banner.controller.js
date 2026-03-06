const Banner = require('./banner.model');
const { successResponse, errorResponse } = require('../../utils/responseFormatter');
const { uploadBufferToGridFS, deleteImage, getImageInfo } = require('../../config/gridfs');
const mongoose = require('mongoose');
const crypto = require('crypto');
const path = require('path');

const bannerController = {
  // Public: get active banners sorted by sortOrder
  async getBanners(req, res, next) {
    try {
      const banners = await Banner.find({ isActive: true })
        .sort({ sortOrder: 1 })
        .lean();

      for (const banner of banners) {
        if (banner.imageId) {
          banner.image = await getImageInfo(banner.imageId);
        }
      }

      successResponse(res, banners);
    } catch (error) {
      next(error);
    }
  },

  // Admin: get all banners for management
  async getAllBanners(req, res, next) {
    try {
      const banners = await Banner.find()
        .sort({ sortOrder: 1, createdAt: -1 })
        .lean();

      for (const banner of banners) {
        if (banner.imageId) {
          banner.image = await getImageInfo(banner.imageId);
        }
      }

      successResponse(res, banners);
    } catch (error) {
      next(error);
    }
  },

  // Admin/Employee: create banner with optional image upload
  async createBanner(req, res, next) {
    try {
      const { title, subtitle, backgroundColor, linkType, linkValue, isActive, sortOrder } = req.body;

      if (!title) {
        return errorResponse(res, 'Title is required', 400);
      }

      let imageId = null;

      if (req.file) {
        const filename = crypto.randomBytes(16).toString('hex') + path.extname(req.file.originalname);
        imageId = await uploadBufferToGridFS(req.file.buffer, filename, req.file.mimetype);
      }

      const banner = await Banner.create({
        title,
        subtitle,
        imageId,
        backgroundColor: backgroundColor || '#1E3A8A',
        linkType: linkType || 'url',
        linkValue: linkValue || '',
        isActive: isActive !== undefined ? (isActive === 'true' || isActive === true) : true,
        sortOrder: sortOrder ? Number(sortOrder) : 0,
        createdBy: req.user?.userId
      });

      successResponse(res, banner, 'Banner created successfully', 201);
    } catch (error) {
      next(error);
    }
  },

  // Admin/Employee: update banner, optionally replace image
  async updateBanner(req, res, next) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return errorResponse(res, 'Invalid banner ID', 400);
      }

      const banner = await Banner.findById(id);
      if (!banner) {
        return errorResponse(res, 'Banner not found', 404);
      }

      const { title, subtitle, backgroundColor, linkType, linkValue, isActive, sortOrder } = req.body;

      const updateData = {};
      if (title !== undefined) updateData.title = title;
      if (subtitle !== undefined) updateData.subtitle = subtitle;
      if (backgroundColor !== undefined) updateData.backgroundColor = backgroundColor;
      if (linkType !== undefined) updateData.linkType = linkType;
      if (linkValue !== undefined) updateData.linkValue = linkValue;
      if (isActive !== undefined) updateData.isActive = isActive === 'true' || isActive === true;
      if (sortOrder !== undefined) updateData.sortOrder = Number(sortOrder);

      if (req.file) {
        if (banner.imageId) {
          try { await deleteImage(banner.imageId); } catch (err) { console.error('Failed to delete old banner image:', err); }
        }
        const filename = crypto.randomBytes(16).toString('hex') + path.extname(req.file.originalname);
        updateData.imageId = await uploadBufferToGridFS(req.file.buffer, filename, req.file.mimetype);
      }

      const updated = await Banner.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).lean();

      if (updated.imageId) {
        updated.image = await getImageInfo(updated.imageId);
      }

      successResponse(res, updated, 'Banner updated successfully');
    } catch (error) {
      next(error);
    }
  },

  // Admin: delete banner and its image from GridFS
  async deleteBanner(req, res, next) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return errorResponse(res, 'Invalid banner ID', 400);
      }

      const banner = await Banner.findById(id);
      if (!banner) {
        return errorResponse(res, 'Banner not found', 404);
      }

      if (banner.imageId) {
        try { await deleteImage(banner.imageId); } catch (err) { console.error('Failed to delete banner image:', err); }
      }

      await Banner.findByIdAndDelete(id);

      successResponse(res, null, 'Banner deleted successfully');
    } catch (error) {
      next(error);
    }
  }
};

module.exports = bannerController;
