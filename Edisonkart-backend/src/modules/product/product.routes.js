const express = require('express');
const router = express.Router();
const productController = require('./product.controller');
const { verifyToken } = require('../../middleware/auth.middleware');
const { requireRole } = require('../../middleware/role.middleware');
const { uploadProductWithVariants } = require('../../config/gridfs');

// Public routes
router.get('/', productController.getAll);
router.get('/search/suggestions', productController.getSuggestions);
router.get('/image/:imageId', productController.getImage);

// Admin routes (must be before /:slug to avoid being matched as a slug)
router.get('/admin',
  verifyToken,
  requireRole('ADMIN', 'VENDOR'),
  productController.getAdminProducts
);

// Public route (must be after specific routes like /admin)
router.get('/:slug', productController.getBySlug);

router.post('/',
  verifyToken,
  requireRole('ADMIN', 'VENDOR'),
  uploadProductWithVariants,
  productController.create
);

router.put('/:id',
  verifyToken,
  requireRole('ADMIN', 'VENDOR'),
  uploadProductWithVariants,
  productController.update
);

router.delete('/:id',
  verifyToken,
  requireRole('ADMIN', 'VENDOR'),
  productController.delete
);

module.exports = router;