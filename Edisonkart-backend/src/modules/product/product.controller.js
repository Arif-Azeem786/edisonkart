const Product = require('./product.model');
const Category = require('../category/category.model');
const { successResponse, errorResponse } = require('../../utils/responseFormatter');
const slugify = require('../../utils/slugify');
const { getImageStream, getImageInfo, deleteImage, getImagesInfo, getVideoStream, getVideoInfo, deleteVideo } = require('../../config/gridfs');
const mongoose = require('mongoose');
const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const productController = {
  // Create product (Admin only)
  async create(req, res, next) {
    try {
      const { name, description, brand, categoryId, price, discountPrice, stock, isFlashSale, flashSaleEndTime, hasVariants, variantAttributes, variants } = req.body;

      // Handle FormData string conversions and nulls
      const cleanIsFlashSale = isFlashSale === 'true' || isFlashSale === true;
      const cleanFlashSaleEndTime = (flashSaleEndTime && flashSaleEndTime !== 'undefined' && flashSaleEndTime !== 'null' && flashSaleEndTime !== '') ? new Date(flashSaleEndTime) : null;
      const cleanHasVariants = hasVariants === 'true' || hasVariants === true;

      let cleanVariantAttributes = [];
      let cleanVariants = [];

      if (cleanHasVariants) {
        try {
          cleanVariantAttributes = typeof variantAttributes === 'string' ? JSON.parse(variantAttributes) : variantAttributes;
          cleanVariants = typeof variants === 'string' ? JSON.parse(variants) : variants;
        } catch (e) {
          return errorResponse(res, 'Invalid variants data format', 400);
        }
      }

      // Check category exists
      if (!categoryId || !mongoose.Types.ObjectId.isValid(categoryId)) {
        return errorResponse(res, 'Invalid or missing Category ID', 400);
      }

      const category = await Category.findById(categoryId);
      if (!category) {
        return errorResponse(res, 'Category not found', 400);
      }

      const slug = slugify(name);

      // Check if slug exists
      const existingProduct = await Product.findOne({ slug });
      if (existingProduct) {
        return errorResponse(res, 'Product with this name already exists', 400);
      }

      // Handle uploaded images (upload.fields: req.files = { images: [...], variant_0_images: [...] })
      const mainFiles = Array.isArray(req.files?.images) ? req.files.images : (req.files ? [] : []);
      const imageIds = mainFiles.map(file => file.id);

      const videoFiles = Array.isArray(req.files?.videos) ? req.files.videos : [];
      const videoIds = videoFiles.map(file => file.id);

      // Merge variant image uploads into variants
      let finalVariants = cleanVariants;
      if (cleanHasVariants && req.files && typeof req.files === 'object') {
        finalVariants = cleanVariants.map((v, idx) => {
          const fieldName = `variant_${idx}_images`;
          const variantFiles = Array.isArray(req.files[fieldName]) ? req.files[fieldName] : [];
          const newImageIds = variantFiles.map(f => f.id);
          return {
            ...v,
            imageIds: newImageIds.length > 0 ? newImageIds : (v.imageIds || [])
          };
        });
      }

      const product = await Product.create({
        name,
        slug,
        description,
        categoryId,
        imageIds,
        videoIds,
        brand,
        price,
        discountPrice,
        stock,
        isFlashSale: cleanIsFlashSale,
        flashSaleEndTime: cleanFlashSaleEndTime,
        vendorId: req.user.role === 'VENDOR' ? req.user.userId : req.body.vendorId,
        hasVariants: cleanHasVariants,
        variantAttributes: cleanVariantAttributes,
        variants: finalVariants
      });

      successResponse(res, product, 'Product created successfully', 201);
    } catch (error) {
      next(error);
    }
  },

  // Get all products (Admin - with full filtering)
  async getAdminProducts(req, res, next) {
    try {
      const {
        page = 1,
        limit = 12,
        category,
        minPrice,
        maxPrice,
        sort = 'createdAt',
        order = 'desc',
        search,
        isActive
      } = req.query;

      const query = {};

      // Status filter
      if (isActive !== undefined && isActive !== 'all') {
        query.isActive = isActive === 'true';
      }

      // Vendor filter - if user is a VENDOR, they can only see their own products
      if (req.user.role === 'VENDOR') {
        query.vendorId = req.user.userId;
      } else if (req.user.role === 'ADMIN' && req.query.vendorId) {
        query.vendorId = req.query.vendorId;
      }

      // Category filter
      if (category && category !== 'all') {
        // If category is ObjectId
        if (mongoose.Types.ObjectId.isValid(category)) {
          query.categoryId = category;
        } else {
          const categoryDoc = await Category.findOne({ slug: category });
          if (categoryDoc) query.categoryId = categoryDoc._id;
        }
      }

      // Search (Regex for partial match)
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      // Pagination
      const skip = (page - 1) * limit;
      const sortOptions = { [sort]: order === 'desc' ? -1 : 1 };

      const products = await Product.find(query)
        .populate('categoryId', 'name slug')
        .sort(sortOptions)
        .skip(skip)
        .limit(Number(limit))
        .lean();

      // Get images
      for (let product of products) {
        if (product.imageIds?.length > 0) {
          product.images = await getImagesInfo(product.imageIds);
        }
      }

      const total = await Product.countDocuments(query);

      successResponse(res, {
        products,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get all products (Public - Active only)
  async getAll(req, res, next) {
    try {
      const {
        page = 1,
        limit = 12,
        category,
        minPrice,
        maxPrice,
        sort = 'createdAt',
        order = 'desc',
        search,
        rating,
        availability,
        discount,
        brand,
        isFlashSale
      } = req.query;

      const query = { isActive: true };

      // Flash sale filter — only active sales whose end time hasn't passed
      if (isFlashSale === 'true') {
        query.isFlashSale = true;
        query.flashSaleEndTime = { $gt: new Date() };
      }

      // Category filter
      if (category) {
        const categoryDoc = await Category.findOne({ slug: category });
        if (categoryDoc) {
          query.categoryId = categoryDoc._id;
        }
      }

      // Price filter
      if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) query.price.$gte = Number(minPrice);
        if (maxPrice) query.price.$lte = Number(maxPrice);
      }

      // Rating filter
      if (rating) {
        query.averageRating = { $gte: Number(rating) };
      }

      // Availability filter
      if (availability === 'inStock') {
        query.stock = { $gt: 0 };
      }

      // Brand filter
      if (brand) {
        const brands = brand.split(',');
        query.brand = { $in: brands };
      }

      // Discount filter
      if (discount) {
        const minDiscount = Number(discount);
        query.$expr = {
          $gte: [
            {
              $multiply: [
                {
                  $divide: [
                    { $subtract: ["$price", { $ifNull: ["$discountPrice", "$price"] }] },
                    "$price"
                  ]
                },
                100
              ]
            },
            minDiscount
          ]
        };
      }

      // Search
      if (search) {
        query.$text = { $search: search };
      }

      // Pagination
      const skip = (page - 1) * limit;
      const sortOptions = { [sort]: order === 'desc' ? -1 : 1 };

      const products = await Product.find(query)
        .populate('categoryId', 'name slug')
        .sort(sortOptions)
        .skip(skip)
        .limit(Number(limit))
        .lean();

      // Get images
      for (let product of products) {
        if (product.imageIds?.length > 0) {
          product.images = await getImagesInfo(product.imageIds);
        }
      }

      const total = await Product.countDocuments(query);

      successResponse(res, {
        products,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get search suggestions
  async getSuggestions(req, res, next) {
    try {
      const { q } = req.query;
      if (!q || q.length < 1) {
        return successResponse(res, []);
      }

      const suggestions = await Product.find({
        isActive: true,
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { brand: { $regex: q, $options: 'i' } }
        ]
      })
        .select('name brand imageIds')
        .limit(8)
        .lean();

      // Get first image for each suggestion
      for (let product of suggestions) {
        if (product.imageIds?.length > 0) {
          product.image = await getImageInfo(product.imageIds[0]);
        }
      }

      successResponse(res, suggestions);
    } catch (error) {
      next(error);
    }
  },


  // Get product by slug or id
  async getBySlug(req, res, next) {
    try {
      const param = req.params.slug;
      const isObjectId = mongoose.Types.ObjectId.isValid(param);

      const query = isObjectId
        ? { _id: param }
        : { slug: param, isActive: true };

      const product = await Product.findOne(query)
        .populate('categoryId', 'name slug')
        .lean();

      if (!product) {
        return errorResponse(res, 'Product not found', 404);
      }

      // Get images
      if (product.imageIds && product.imageIds.length > 0) {
        product.images = await getImagesInfo(product.imageIds);
      }

      // Expose video URLs for frontend (videoIds are already on product)
      if (product.videoIds && product.videoIds.length > 0) {
        product.videoUrls = product.videoIds.map(vid => `/api/products/video/${vid}`);
      }

      // Get related products (same category)
      const relatedProducts = await Product.find({
        categoryId: product.categoryId,
        _id: { $ne: product._id },
        isActive: true
      })
        .limit(4)
        .select('name slug price discountPrice imageIds')
        .lean();

      product.relatedProducts = relatedProducts;

      successResponse(res, product);
    } catch (error) {
      next(error);
    }
  },

  // Update product (Admin only)
  async update(req, res, next) {
    try {
      const { id } = req.params;
      
      // Ownership check for vendors
      if (req.user.role === 'VENDOR') {
        const existing = await Product.findById(id);
        if (!existing || existing.vendorId?.toString() !== req.user.userId) {
          return errorResponse(res, 'Access denied. You can only update your own products.', 403);
        }
      }

      const { name, description, brand, categoryId, price, discountPrice, stock, isActive, isFlashSale, flashSaleEndTime, hasVariants, variantAttributes, variants } = req.body;

      // Handle FormData string conversions and nulls
      const cleanIsFlashSale = isFlashSale === 'true' || isFlashSale === true;
      const cleanFlashSaleEndTime = (flashSaleEndTime && flashSaleEndTime !== 'undefined' && flashSaleEndTime !== 'null' && flashSaleEndTime !== '') ? new Date(flashSaleEndTime) : null;
      const cleanIsActive = isActive === 'true' || isActive === true || isActive === undefined; // Default active if undefined
      const cleanHasVariants = hasVariants === 'true' || hasVariants === true;

      const updateData = {
        description,
        brand,
        price,
        discountPrice,
        stock,
        isActive: cleanIsActive,
        isFlashSale: cleanIsFlashSale,
        flashSaleEndTime: cleanFlashSaleEndTime,
        hasVariants: cleanHasVariants
      };

      if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
        updateData.categoryId = categoryId;
      }

      if (cleanHasVariants) {
        try {
          updateData.variantAttributes = typeof variantAttributes === 'string' ? JSON.parse(variantAttributes) : variantAttributes;
          updateData.variants = typeof variants === 'string' ? JSON.parse(variants) : variants;
        } catch (e) {
          return errorResponse(res, 'Invalid variants data format', 400);
        }
      }

      if (name) {
        updateData.name = name;
        updateData.slug = slugify(name);
      }

      // Handle new images if uploaded (upload.fields: req.files = { images: [...], variant_N_images: [...] })
      const mainFiles = Array.isArray(req.files?.images) ? req.files.images : [];
      if (mainFiles.length > 0) {
        const existing = await Product.findById(id);
        if (existing?.imageIds?.length > 0) {
          for (const imageId of existing.imageIds) {
            try { await deleteImage(imageId); } catch (err) { console.error('Failed to delete image:', err); }
          }
        }
        updateData.imageIds = mainFiles.map(file => file.id);
      }

      // Handle new videos if uploaded
      const videoFiles = Array.isArray(req.files?.videos) ? req.files.videos : [];
      if (videoFiles.length > 0) {
        const existing = await Product.findById(id);
        if (existing?.videoIds?.length > 0) {
          for (const videoId of existing.videoIds) {
            try { await deleteVideo(videoId); } catch (err) { console.error('Failed to delete video:', err); }
          }
        }
        updateData.videoIds = videoFiles.map(file => file.id);
      }

      // Merge variant image uploads into variants (keep existing + add new, or use trimmed list from form)
      if (cleanHasVariants && updateData.variants) {
        updateData.variants = updateData.variants.map((v, idx) => {
          const fieldName = `variant_${idx}_images`;
          const variantFiles = req.files && typeof req.files === 'object' && Array.isArray(req.files[fieldName])
            ? req.files[fieldName]
            : [];
          const newImageIds = variantFiles.map(f => f.id);
          const existingIds = Array.isArray(v.imageIds) ? v.imageIds : [];
          const mergedIds = newImageIds.length > 0 ? [...existingIds, ...newImageIds] : existingIds;
          return { ...v, imageIds: mergedIds };
        });
      }

      const product = await Product.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).populate('categoryId', 'name slug');

      if (!product) {
        return errorResponse(res, 'Product not found', 404);
      }

      successResponse(res, product, 'Product updated successfully');
    } catch (error) {
      next(error);
    }
  },

  // Delete product (Admin only)
  async delete(req, res, next) {
    try {
      const { id } = req.params;

      const product = await Product.findById(id);
      if (!product) {
        return errorResponse(res, 'Product not found', 404);
      }

      // Ownership check for vendors
      if (req.user.role === 'VENDOR' && product.vendorId?.toString() !== req.user.userId) {
        return errorResponse(res, 'Access denied. You can only delete your own products.', 403);
      }

      // Soft delete — keep images intact so the product can be reactivated later
      product.isActive = false;
      await product.save();

      successResponse(res, null, 'Product deleted successfully');
    } catch (error) {
      next(error);
    }
  },

  // Get product image
  async getImage(req, res, next) {
    try {
      const { imageId } = req.params;

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

  // Get product video
  async getVideo(req, res, next) {
    try {
      const { videoId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(videoId)) {
        return errorResponse(res, 'Invalid video ID', 400);
      }

      const videoInfo = await getVideoInfo(new mongoose.Types.ObjectId(videoId));
      if (!videoInfo) {
        return errorResponse(res, 'Video not found', 404);
      }

      const range = req.headers.range;
      const videoSize = videoInfo.length;

      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : videoSize - 1;
        const chunkSize = end - start + 1;

        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${videoSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize,
          'Content-Type': videoInfo.contentType
        });

        const stream = getVideoStream(new mongoose.Types.ObjectId(videoId));
        stream.pipe(res);
      } else {
        res.set('Content-Type', videoInfo.contentType);
        res.set('Content-Length', videoSize);

        const stream = getVideoStream(new mongoose.Types.ObjectId(videoId));
        stream.pipe(res);
      }
    } catch (error) {
      next(error);
    }
  },

  async searchByImage(req, res, next) {
    try {
      if (!req.file) {
        return errorResponse(res, 'No image uploaded', 400);
      }

      if (!process.env.OPENAI_API_KEY) {
        return errorResponse(res, 'Image search is not configured', 500);
      }

      const base64Image = req.file.buffer.toString('base64');
      const mimeType = req.file.mimetype || 'image/jpeg';

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Identify this product. Return ONLY a short search query (3-6 words) that would help find this product in an online store. Include the product type, color, and brand if visible. No explanations, just the search terms.'
              },
              {
                type: 'image_url',
                image_url: { url: `data:${mimeType};base64,${base64Image}` }
              }
            ]
          }
        ],
        max_tokens: 50
      });

      const searchTerms = response.choices[0]?.message?.content?.trim() || '';
      console.log(`[image-search] AI identified: "${searchTerms}"`);

      if (!searchTerms) {
        return errorResponse(res, 'Could not identify the product in the image', 422);
      }

      const words = searchTerms.split(/\s+/).filter(w => w.length > 2);
      const regexPattern = words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');

      const products = await Product.find({
        $or: [
          { name: { $regex: regexPattern, $options: 'i' } },
          { description: { $regex: regexPattern, $options: 'i' } }
        ]
      })
        .select('name slug price discountPrice images rating')
        .limit(20)
        .lean();

      return successResponse(res, {
        searchTerms,
        products,
        total: products.length
      });
    } catch (error) {
      console.error('[image-search] Error:', error.message);
      if (error.status === 429) {
        return errorResponse(res, 'Too many requests. Please try again in a moment.', 429);
      }
      next(error);
    }
  }
};

module.exports = productController;