const router = require('express').Router();
const ctrl = require('./settings.controller');
const { verifyToken } = require('../../middleware/auth.middleware');
const { requireRole } = require('../../middleware/role.middleware');

router.get('/public', ctrl.getPublic);
router.get('/', verifyToken, requireRole('ADMIN'), ctrl.getAll);
router.put('/', verifyToken, requireRole('ADMIN'), ctrl.update);
router.post('/toggle-cod', verifyToken, requireRole('ADMIN'), ctrl.toggleCod);

module.exports = router;
