const Category = require('./category.model');
const { successResponse, errorResponse } = require('../../utils/responseFormatter');
const slugify = require('../../utils/slugify');

const categoryController = {
  // Create category (Admin only)
  async create(req, res, next) {
    try {
      const { name } = req.body;
      const slug = slugify(name);

      const existingCategory = await Category.findOne({ slug });
      if (existingCategory) {
        return errorResponse(res, 'Category already exists', 400);
      }

      const category = await Category.create({
        name,
        slug
      });

      successResponse(res, category, 'Category created successfully', 201);
    } catch (error) {
      next(error);
    }
  },

  // Get all categories
  async getAll(req, res, next) {
    try {
      const { includeInactive } = req.query;
      const query = includeInactive === 'true' ? {} : { isActive: true };

      const categories = await Category.find(query)
        .sort({ name: 1 })
        .lean();

      successResponse(res, categories);
    } catch (error) {
      next(error);
    }
  },

  // Get category by slug
  async getBySlug(req, res, next) {
    try {
      const category = await Category.findOne({
        slug: req.params.slug,
        isActive: true
      }).lean();

      if (!category) {
        return errorResponse(res, 'Category not found', 404);
      }

      successResponse(res, category);
    } catch (error) {
      next(error);
    }
  },

  // Update category (Admin only)
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { name, isActive } = req.body;

      const updateData = { isActive };
      if (name) {
        updateData.name = name;
        updateData.slug = slugify(name);
      }

      const category = await Category.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );

      if (!category) {
        return errorResponse(res, 'Category not found', 404);
      }

      successResponse(res, category, 'Category updated successfully');
    } catch (error) {
      next(error);
    }
  },

  // Delete category (Admin only)
  async delete(req, res, next) {
    try {
      const { id } = req.params;

      // Check if category has products
      const Product = require('../product/product.model');
      const productsCount = await Product.countDocuments({ categoryId: id });

      if (productsCount > 0) {
        return errorResponse(res, 'Cannot delete category with existing products', 400);
      }

      const category = await Category.findByIdAndDelete(id);
      if (!category) {
        return errorResponse(res, 'Category not found', 404);
      }

      successResponse(res, null, 'Category deleted successfully');
    } catch (error) {
      next(error);
    }
  }
};

module.exports = categoryController;