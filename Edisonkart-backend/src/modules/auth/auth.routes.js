const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const socialController = require('./social.controller');
const validate = require('../../middleware/validate.middleware');
const { registerSchema, verifyOTPSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } = require('./auth.validation');

router.post('/register', validate(registerSchema), authController.register);
router.post('/verify-otp', validate(verifyOTPSchema), authController.verifyOTP);
router.post('/resend-otp', validate(forgotPasswordSchema), authController.resendOTP);
router.post('/login', validate(loginSchema), authController.login);
router.post('/create-admin', validate(loginSchema), authController.createAdmin);
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/verify-reset-otp', validate(verifyOTPSchema), authController.verifyResetOTP);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

router.post('/google', socialController.googleLogin);

module.exports = router;