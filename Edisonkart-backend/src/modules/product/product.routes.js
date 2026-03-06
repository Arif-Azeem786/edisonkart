const express = require('express');
const router = express.Router();
const multer = require('multer');
const productController = require('./product.controller');
const importController = require('./import.controller');
const { verifyToken } = require('../../middleware/auth.middleware');
const { requireRole } = require('../../middleware/role.middleware');
const { uploadProductWithVariants } = require('../../config/gridfs');

const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'), false);
  }
}).single('image');

// Public routes
router.get('/', productController.getAll);
router.get('/search/suggestions', productController.getSuggestions);
router.post('/search/image', memoryUpload, productController.searchByImage);
router.get('/image/:imageId', productController.getImage);
router.get('/video/:videoId', productController.getVideo);

// Import product from external URL (must be before /:slug)
router.post('/import', verifyToken, importController.importFromUrl);

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