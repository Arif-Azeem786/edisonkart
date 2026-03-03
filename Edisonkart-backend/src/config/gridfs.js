const mongoose = require('mongoose');
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');
const { Readable } = require('stream');

let gridFSBucket;

const setupGridFS = () => {
  const conn = mongoose.connection;

  conn.once('open', () => {
    gridFSBucket = new mongoose.mongo.GridFSBucket(conn.db, {
      bucketName: 'productImages'
    });
    console.log('📸 GridFS initialized');
  });
};

// Custom storage engine that writes directly to GridFSBucket
// (replaces multer-gridfs-storage which has compatibility issues)
const gridFsStorage = {
  _handleFile(req, file, cb) {
    if (!gridFSBucket) {
      return cb(new Error('GridFS not initialized yet'));
    }

    crypto.randomBytes(16, (err, buf) => {
      if (err) return cb(err);

      const filename = buf.toString('hex') + path.extname(file.originalname);

      const uploadStream = gridFSBucket.openUploadStream(filename, {
        contentType: file.mimetype,
        metadata: {
          uploadedBy: req.user?.userId || 'system',
          originalName: file.originalname,
          uploadDate: new Date()
        }
      });

      file.stream.pipe(uploadStream)
        .on('error', (err) => cb(err))
        .on('finish', () => {
          cb(null, {
            id: uploadStream.id,
            filename: filename,
            size: uploadStream.length,
            contentType: file.mimetype
          });
        });
    });
  },

  _removeFile(req, file, cb) {
    if (!gridFSBucket) return cb(null);
    gridFSBucket.delete(file.id).then(() => cb(null)).catch(cb);
  }
};

// Upload middleware
const upload = multer({
  storage: gridFsStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Helper functions for GridFS operations
const getImageStream = (fileId) => {
  return gridFSBucket.openDownloadStream(fileId);
};

const getImageInfo = async (fileId) => {
  const files = await gridFSBucket.find({ _id: fileId }).toArray();
  return files[0];
};

const deleteImage = async (fileId) => {
  return gridFSBucket.delete(fileId);
};

const getImagesInfo = async (fileIds) => {
  const files = await gridFSBucket.find({ _id: { $in: fileIds } }).toArray();
  return files;
};

// Product upload with main images + per-variant images (up to 20 variants, 5 images each)
const variantFields = Array.from({ length: 20 }, (_, i) => ({ name: `variant_${i}_images`, maxCount: 5 }));
const productUploadFields = [
  { name: 'images', maxCount: 5 },
  ...variantFields
];
const uploadProductWithVariants = multer({
  storage: gridFsStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) return cb(null, true);
    cb(new Error('Only image files are allowed'));
  }
}).fields(productUploadFields);

module.exports = {
  setupGridFS,
  upload,
  uploadProductWithVariants,
  getImageStream,
  getImageInfo,
  deleteImage,
  getImagesInfo
};
