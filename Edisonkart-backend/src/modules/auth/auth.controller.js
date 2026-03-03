const jwt = require('jsonwebtoken');
const User = require('../user/user.model');
const generateOTP = require('../../utils/generateOTP');
const emailService = require('../../utils/emailService');
const { successResponse, errorResponse } = require('../../utils/responseFormatter');

const authController = {
  // Register new user
  async register(req, res, next) {
    try {
      const { name, email, password } = req.body;

      // Check if user exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return errorResponse(res, 'Email already registered', 400);
      }

      // Generate OTP
      const otp = generateOTP();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Create user
      const user = await User.create({
        name,
        email,
        password,
        otp,
        otpExpiry
      });

      // Send OTP email
      await emailService.sendOTP(email, otp);

      successResponse(res, {
        userId: user._id,
        email: user.email
      }, 'Registration successful. Please verify your email.', 201);
    } catch (error) {
      next(error);
    }
  },

  // Verify OTP
  async verifyOTP(req, res, next) {
    try {
      const { email, otp } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        return errorResponse(res, 'User not found', 404);
      }

      if (user.isVerified) {
        return errorResponse(res, 'Email already verified', 400);
      }

      if (user.otp !== otp || user.otpExpiry < new Date()) {
        return errorResponse(res, 'Invalid or expired OTP', 400);
      }

      user.isVerified = true;
      user.otp = undefined;
      user.otpExpiry = undefined;
      await user.save();

      successResponse(res, null, 'Email verified successfully');
    } catch (error) {
      next(error);
    }
  },

  // Resend OTP
  async resendOTP(req, res, next) {
    try {
      const { email } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        return errorResponse(res, 'User not found', 404);
      }

      if (user.isVerified) {
        return errorResponse(res, 'Email already verified', 400);
      }

      const otp = generateOTP();
      user.otp = otp;
      user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();

      await emailService.sendOTP(email, otp);

      successResponse(res, null, 'OTP resent successfully');
    } catch (error) {
      next(error);
    }
  },

  // Login
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        return errorResponse(res, 'User not found', 404);
      }

      if (!user.isVerified) {
        // Use 200 status with error payload instead of 401 to avoid frontend "status code 401" toast.
        return errorResponse(res, 'Please verify your email first', 200);
      }

      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        // Use 200 status with error payload instead of 401 to avoid frontend "status code 401" toast.
        return errorResponse(res, 'Incorrect password', 200);
      }

      const token = jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
      );

      successResponse(res, {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          addresses: user.addresses
        }
      }, 'Login successful');
    } catch (error) {
      next(error);
    }
  },

  // Create admin (call this once to create first admin)
  async createAdmin(req, res, next) {
    try {
      const { email, password } = req.body;

      // Check if admin exists
      const existingAdmin = await User.findOne({ role: 'ADMIN' });
      if (existingAdmin) {
        return errorResponse(res, 'Admin already exists', 400);
      }

      const user = await User.create({
        name: 'Admin',
        email,
        password,
        role: 'ADMIN',
        isVerified: true
      });

      successResponse(res, {
        email: user.email,
        role: user.role
      }, 'Admin created successfully');
    } catch (error) {
      next(error);
    }
  },

  // Forgot Password - Send OTP
  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        return errorResponse(res, 'No account found with this email address', 404);
      }

      if (!user.isVerified) {
        return errorResponse(res, 'Please verify your email first', 400);
      }

      const otp = generateOTP();
      user.otp = otp;
      user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      await user.save();

      await emailService.sendPasswordResetOTP(email, otp);

      successResponse(res, null, 'OTP has been sent to your email address');
    } catch (error) {
      next(error);
    }
  },

  // Verify Reset OTP (without consuming it)
  async verifyResetOTP(req, res, next) {
    try {
      const { email, otp } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        return errorResponse(res, 'User not found', 404);
      }

      if (user.otp !== otp || user.otpExpiry < new Date()) {
        return errorResponse(res, 'Invalid or expired OTP', 400);
      }

      successResponse(res, null, 'OTP verified successfully');
    } catch (error) {
      next(error);
    }
  },

  // Reset Password
  async resetPassword(req, res, next) {
    try {
      const { email, otp, newPassword } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        return errorResponse(res, 'User not found', 404);
      }

      if (user.otp !== otp || user.otpExpiry < new Date()) {
        return errorResponse(res, 'Invalid or expired OTP', 400);
      }

      user.password = newPassword;
      user.otp = undefined;
      user.otpExpiry = undefined;
      await user.save();

      successResponse(res, null, 'Password reset successfully');
    } catch (error) {
      next(error);
    }
  }
};

module.exports = authController;