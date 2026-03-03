const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  async sendOTP(email, otp) {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Email Verification - Edisonkart',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to Edisonkart!</h2>
          <p>Your email verification OTP is:</p>
          <h1 style="color: #4CAF50; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
          <p>This OTP is valid for 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <hr>
          <p style="color: #666; font-size: 12px;">© 2024 Edisonkart. All rights reserved.</p>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`📧 OTP sent to ${email}`);
    } catch (error) {
      console.error('Email sending failed:', error);
      throw new Error('Failed to send OTP email');
    }
  }

  async sendPasswordResetOTP(email, otp) {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Password Reset OTP - Edisonkart',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1E3A8A;">Password Reset Request</h2>
          <p>We received a request to reset your password. Use this OTP to proceed:</p>
          <h1 style="color: #F97316; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
          <p>This OTP is valid for <strong>10 minutes</strong>.</p>
          <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
          <hr>
          <p style="color: #666; font-size: 12px;">© 2024 Edisonkart. All rights reserved.</p>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`📧 Password reset OTP sent to ${email}`);
    } catch (error) {
      console.error('Password reset email failed:', error);
      throw new Error('Failed to send password reset email');
    }
  }

  async sendOrderConfirmation(email, orderDetails) {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `Order Confirmed - ${orderDetails.orderId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Thank you for your order!</h2>
          <p>Your order <strong>${orderDetails.orderId}</strong> has been confirmed.</p>
          <h3>Order Summary:</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="background: #f5f5f5;">
              <th style="padding: 10px; text-align: left;">Item</th>
              <th style="padding: 10px; text-align: left;">Qty</th>
              <th style="padding: 10px; text-align: left;">Price</th>
            </tr>
            ${orderDetails.items.map(item => `
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.nameSnapshot}</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.quantity}</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;">₹${item.priceSnapshot}</td>
              </tr>
            `).join('')}
          </table>
          <h3 style="text-align: right;">Total: ₹${orderDetails.totalAmount}</h3>
          <p>We'll notify you when your order is out for delivery.</p>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Order confirmation email failed:', error);
    }
  }
}

module.exports = new EmailService();