const jwt = require('jsonwebtoken');
const User = require('../user/user.model');
const { successResponse, errorResponse } = require('../../utils/responseFormatter');

async function verifyGoogleToken(idToken) {
  const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
  if (!response.ok) throw new Error('Invalid Google token');
  const payload = await response.json();
  if (!payload.email_verified) throw new Error('Email not verified');
  return {
    email: payload.email,
    name: payload.name || payload.email.split('@')[0],
    picture: payload.picture,
    googleId: payload.sub,
  };
}

const socialController = {
  async googleLogin(req, res, next) {
    try {
      const { idToken, credential, accessToken, userInfo } = req.body;
      const token = idToken || credential;

      let googleUser;

      if (token) {
        googleUser = await verifyGoogleToken(token);
      } else if (accessToken && userInfo?.email) {
        const verifyRes = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (!verifyRes.ok) throw new Error('Invalid Google access token');
        const verified = await verifyRes.json();
        if (verified.email !== userInfo.email) throw new Error('Email mismatch');
        googleUser = {
          email: verified.email,
          name: verified.name || verified.email.split('@')[0],
          picture: verified.picture,
          googleId: verified.sub,
        };
      } else {
        return errorResponse(res, 'Google token is required', 400);
      }

      let user = await User.findOne({ email: googleUser.email });

      if (!user) {
        user = await User.create({
          name: googleUser.name,
          email: googleUser.email,
          password: require('crypto').randomBytes(32).toString('hex'),
          isVerified: true,
          googleId: googleUser.googleId,
        });
      } else if (!user.isVerified) {
        user.isVerified = true;
        await user.save();
      }

      const jwtToken = jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      successResponse(res, {
        token: jwtToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      }, 'Login successful');
    } catch (error) {
      console.error('Google login error:', error.message);
      if (error.message.includes('Invalid') || error.message.includes('not verified')) {
        return errorResponse(res, error.message, 401);
      }
      next(error);
    }
  },
};

module.exports = socialController;
