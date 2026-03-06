const Loyalty = require('./referral.model');
const { successResponse, errorResponse } = require('../../utils/responseFormatter');
const crypto = require('crypto');

function generateCode() {
  return 'EK' + crypto.randomBytes(3).toString('hex').toUpperCase();
}

async function getOrCreate(userId) {
  let loyalty = await Loyalty.findOne({ userId });
  if (!loyalty) {
    loyalty = await Loyalty.create({ userId, referralCode: generateCode(), points: 0, totalEarned: 0, totalRedeemed: 0 });
  }
  if (!loyalty.referralCode) {
    loyalty.referralCode = generateCode();
    await loyalty.save();
  }
  return loyalty;
}

async function addPoints(userId, points, type, description, orderId) {
  const loyalty = await getOrCreate(userId);
  loyalty.points += points;
  loyalty.totalEarned += points;
  loyalty.history.push({ type, points, description, orderId });
  await loyalty.save();
  return loyalty;
}

async function redeemPoints(userId, points, orderId) {
  const loyalty = await getOrCreate(userId);
  if (loyalty.points < points) return null;
  loyalty.points -= points;
  loyalty.totalRedeemed += points;
  loyalty.history.push({ type: 'redeemed', points: -points, description: 'Redeemed on order', orderId });
  await loyalty.save();
  return loyalty;
}

const referralController = {
  async getMyLoyalty(req, res, next) {
    try {
      const loyalty = await getOrCreate(req.user.userId);
      successResponse(res, {
        points: loyalty.points,
        totalEarned: loyalty.totalEarned,
        totalRedeemed: loyalty.totalRedeemed,
        referralCode: loyalty.referralCode,
        referralCount: loyalty.referrals.length,
        history: loyalty.history.slice(-20).reverse(),
      });
    } catch (error) {
      next(error);
    }
  },

  async applyReferral(req, res, next) {
    try {
      const { code } = req.body;
      if (!code) return errorResponse(res, 'Referral code is required', 400);

      const referrer = await Loyalty.findOne({ referralCode: code.toUpperCase().trim() });
      if (!referrer) return errorResponse(res, 'Invalid referral code', 404);
      if (referrer.userId.toString() === req.user.userId) return errorResponse(res, 'Cannot use your own referral code', 400);

      const myLoyalty = await getOrCreate(req.user.userId);
      if (myLoyalty.referredBy) return errorResponse(res, 'You have already used a referral code', 400);

      myLoyalty.referredBy = referrer.userId;
      myLoyalty.points += 50;
      myLoyalty.totalEarned += 50;
      myLoyalty.history.push({ type: 'welcome_bonus', points: 50, description: 'Referral welcome bonus' });
      await myLoyalty.save();

      referrer.referrals.push(req.user.userId);
      referrer.points += 100;
      referrer.totalEarned += 100;
      referrer.history.push({ type: 'referral_bonus', points: 100, description: 'Friend joined via your referral' });
      await referrer.save();

      successResponse(res, { points: myLoyalty.points }, 'Referral applied! You earned 50 points');
    } catch (error) {
      next(error);
    }
  },

  async redeemPoints(req, res, next) {
    try {
      const { points } = req.body;
      if (!points || points < 100) return errorResponse(res, 'Minimum 100 points to redeem', 400);

      const loyalty = await getOrCreate(req.user.userId);
      if (loyalty.points < points) return errorResponse(res, `You only have ${loyalty.points} points`, 400);

      const discount = Math.floor(points / 10);
      successResponse(res, { pointsToRedeem: points, discount, remainingPoints: loyalty.points - points });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = { referralController, addPoints, redeemPoints, getOrCreate };
