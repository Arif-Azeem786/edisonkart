const mongoose = require('mongoose');
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');
const { Readable } = require('stream');

let gridFSBucket;
let videoBucket;

const setupGridFS = () => {
  const conn = mongoose.connection;

  conn.once('open', () => {
    gridFSBucket = new mongoose.mongo.GridFSBucket(conn.db, {
      bucketName: 'productImages'
    });
    videoBucket = new mongoose.mongo.GridFSBucket(conn.db, {
      bucketName: 'productVideos'
    });
    console.log('📸 GridFS initialized');
  });
};

const gridFsStorage = {
  _handleFile(req, file, cb) {
    if (!gridFSBucket) {
      return cb(new Error('GridFS not initialized yet'));
    }

    const isVideo = file.mimetype.startsWith('video/');
    const bucket = isVideo ? videoBucket : gridFSBucket;

    crypto.randomBytes(16, (err, buf) => {
      if (err) return cb(err);

      const filename = buf.toString('hex') + path.extname(file.originalname);

      const uploadStream = bucket.openUploadStream(filename, {
        contentType: file.mimetype,
        metadata: {
          uploadedBy: req.user?.userId || 'system',
          originalName: file.originalname,
          uploadDate: new Date(),
          type: isVideo ? 'video' : 'image'
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
    const isVideo = file.contentType?.startsWith('video/');
    const bucket = isVideo ? videoBucket : gridFSBucket;
    bucket.delete(file.id).then(() => cb(null)).catch(cb);
  }
};

const upload = multer({
  storage: gridFsStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
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

// Video helpers
const getVideoStream = (fileId) => {
  return videoBucket.openDownloadStream(fileId);
};

const getVideoInfo = async (fileId) => {
  const files = await videoBucket.find({ _id: fileId }).toArray();
  return files[0];
};

const deleteVideo = async (fileId) => {
  return videoBucket.delete(fileId);
};

// Product upload: images + videos + per-variant images
const variantFields = Array.from({ length: 20 }, (_, i) => ({ name: `variant_${i}_images`, maxCount: 5 }));
const productUploadFields = [
  { name: 'images', maxCount: 5 },
  { name: 'videos', maxCount: 3 },
  ...variantFields
];
const uploadProductWithVariants = multer({
  storage: gridFsStorage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const imageTypes = /jpeg|jpg|png|gif|webp/;
    const videoTypes = /mp4|webm|mov|avi|mkv/;

    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    const isImage = imageTypes.test(ext) || file.mimetype.startsWith('image/');
    const isVideo = videoTypes.test(ext) || file.mimetype.startsWith('video/');

    if (isImage || isVideo) return cb(null, true);
    cb(new Error('Only image and video files are allowed'));
  }
}).fields(productUploadFields);

const uploadBufferToGridFS = (buffer, filename, contentType = 'image/jpeg') => {
  return new Promise((resolve, reject) => {
    if (!gridFSBucket) return reject(new Error('GridFS not initialized'));

    const isVideo = contentType.startsWith('video/');
    const bucket = isVideo ? videoBucket : gridFSBucket;

    const readableStream = new Readable();
    readableStream.push(buffer);
    readableStream.push(null);

    const uploadStream = bucket.openUploadStream(filename, {
      contentType,
      metadata: { uploadedBy: 'product-importer', uploadDate: new Date() }
    });

    readableStream.pipe(uploadStream)
      .on('error', reject)
      .on('finish', () => resolve(uploadStream.id));
  });
};

module.exports = {
  setupGridFS,
  upload,
  uploadProductWithVariants,
  getImageStream,
  getImageInfo,
  deleteImage,
  getImagesInfo,
  getVideoStream,
  getVideoInfo,
  deleteVideo,
  uploadBufferToGridFS
};
