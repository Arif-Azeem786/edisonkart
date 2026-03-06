const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const bannerController = require('./banner.controller');
const { verifyToken } = require('../../middleware/auth.middleware');
const { requireRole } = require('../../middleware/role.middleware');

router.get('/', bannerController.getBanners);
router.get('/admin', verifyToken, requireRole('ADMIN'), bannerController.getAllBanners);
router.post('/', verifyToken, requireRole('ADMIN'), upload.single('image'), bannerController.createBanner);
router.put('/:id', verifyToken, requireRole('ADMIN'), upload.single('image'), bannerController.updateBanner);
router.delete('/:id', verifyToken, requireRole('ADMIN'), bannerController.deleteBanner);

module.exports = router;
