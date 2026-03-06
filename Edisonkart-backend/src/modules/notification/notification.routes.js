const express = require('express');
const router = express.Router();
const { notificationController } = require('./notification.controller');
const { verifyToken } = require('../../middleware/auth.middleware');

router.use(verifyToken);

router.get('/', notificationController.getAll);
router.get('/unread-count', notificationController.getUnreadCount);
router.put('/mark-all-read', notificationController.markAllAsRead);
router.put('/:id/read', notificationController.markAsRead);
router.delete('/:id', notificationController.delete);

module.exports = router;
