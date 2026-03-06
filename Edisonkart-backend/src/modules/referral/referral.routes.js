const express = require('express');
const router = express.Router();
const { referralController } = require('./referral.controller');
const { verifyToken } = require('../../middleware/auth.middleware');

router.use(verifyToken);

router.get('/', referralController.getMyLoyalty);
router.post('/apply-referral', referralController.applyReferral);
router.post('/redeem', referralController.redeemPoints);

module.exports = router;
