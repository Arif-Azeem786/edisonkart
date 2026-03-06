const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.EMAIL_HOST || process.env.SMTP_HOST;
  const port = parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT || '587');
  const user = process.env.EMAIL_USER || process.env.SMTP_USER;
  const pass = process.env.EMAIL_PASS || process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.log('[email] SMTP not configured — emails will be logged to console');
    return null;
  }

  transporter = nodemailer.createTransport({
    host, port,
    secure: port === 465,
    auth: { user, pass },
  });

  return transporter;
}

const FROM = process.env.EMAIL_FROM || process.env.SMTP_FROM || 'EdisonKart <noreply@edisonkart.com>';

async function sendEmail({ to, subject, html, text }) {
  const t = getTransporter();
  if (!t) {
    console.log(`[email] (mock) To: ${to} | Subject: ${subject}`);
    return { mock: true };
  }
  return t.sendMail({ from: FROM, to, subject, html: html || text, text });
}

function otpTemplate(name, otp) {
  return {
    subject: 'Your EdisonKart Verification Code',
    html: `<div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#fff;border-radius:12px;border:1px solid #e2e8f0">
      <h2 style="color:#1E3A8A;margin:0 0 16px">EdisonKart</h2>
      <p>Hi ${name || 'there'},</p>
      <p>Your verification code is:</p>
      <div style="text-align:center;margin:24px 0">
        <span style="font-size:32px;letter-spacing:8px;font-weight:700;color:#F97316">${otp}</span>
      </div>
      <p style="color:#64748b;font-size:14px">This code expires in 10 minutes. Do not share it with anyone.</p>
    </div>`,
  };
}

function orderConfirmationTemplate(name, order) {
  const itemsHtml = (order.items || []).map(i =>
    `<tr><td style="padding:8px;border-bottom:1px solid #f1f5f9">${i.nameSnapshot || 'Item'}</td>
     <td style="padding:8px;border-bottom:1px solid #f1f5f9;text-align:center">${i.quantity}</td>
     <td style="padding:8px;border-bottom:1px solid #f1f5f9;text-align:right">₹${Math.round(i.priceSnapshot * i.quantity)}</td></tr>`
  ).join('');

  return {
    subject: `Order Confirmed — ${order.orderId}`,
    html: `<div style="font-family:sans-serif;max-width:560px;margin:auto;padding:32px;background:#fff;border-radius:12px;border:1px solid #e2e8f0">
      <h2 style="color:#1E3A8A;margin:0 0 8px">EdisonKart</h2>
      <p>Hi ${name},</p>
      <p>Your order <strong>${order.orderId}</strong> has been placed successfully!</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <thead><tr style="background:#f8fafc"><th style="padding:8px;text-align:left">Item</th><th style="padding:8px;text-align:center">Qty</th><th style="padding:8px;text-align:right">Price</th></tr></thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <p style="text-align:right;font-size:18px;font-weight:700;color:#F97316">Total: ₹${Math.round(order.totalAmount)}</p>
      <p style="color:#64748b;font-size:14px">We'll notify you when your order ships.</p>
    </div>`,
  };
}

function shippingTemplate(name, order) {
  return {
    subject: `Your Order ${order.orderId} Has Shipped!`,
    html: `<div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#fff;border-radius:12px;border:1px solid #e2e8f0">
      <h2 style="color:#1E3A8A;margin:0 0 16px">EdisonKart</h2>
      <p>Hi ${name},</p>
      <p>Great news! Your order <strong>${order.orderId}</strong> has been shipped. 🚚</p>
      ${order.estimatedDeliveryDate ? `<p>Expected delivery: <strong>${new Date(order.estimatedDeliveryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}</strong></p>` : ''}
      <p style="color:#64748b;font-size:14px">Track your order in the app or on our website.</p>
    </div>`,
  };
}

function deliveredTemplate(name, order) {
  return {
    subject: `Order ${order.orderId} Delivered!`,
    html: `<div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#fff;border-radius:12px;border:1px solid #e2e8f0">
      <h2 style="color:#1E3A8A;margin:0 0 16px">EdisonKart</h2>
      <p>Hi ${name},</p>
      <p>Your order <strong>${order.orderId}</strong> has been delivered! 🎉</p>
      <p>We hope you love your purchase. If you have any issues, feel free to request a return within 7 days.</p>
    </div>`,
  };
}

function outForDeliveryTemplate(name, order) {
  return {
    subject: `Your Order ${order.orderId} is Out for Delivery!`,
    html: `<div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#fff;border-radius:12px;border:1px solid #e2e8f0">
      <h2 style="color:#1E3A8A;margin:0 0 16px">EdisonKart</h2>
      <p>Hi ${name},</p>
      <p>Your order <strong>${order.orderId}</strong> is out for delivery and will arrive today! 🚀</p>
      <p style="color:#64748b;font-size:14px">Please keep your phone handy. The delivery partner may contact you.</p>
    </div>`,
  };
}

function cancelledTemplate(name, order) {
  return {
    subject: `Order ${order.orderId} Cancelled`,
    html: `<div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#fff;border-radius:12px;border:1px solid #e2e8f0">
      <h2 style="color:#1E3A8A;margin:0 0 16px">EdisonKart</h2>
      <p>Hi ${name},</p>
      <p>Your order <strong>${order.orderId}</strong> has been cancelled.</p>
      <p>If you paid online, the refund will be processed within 5-7 business days.</p>
      <p style="color:#64748b;font-size:14px">If you have questions, please contact our support team.</p>
    </div>`,
  };
}

function passwordResetTemplate(name, otp) {
  return {
    subject: 'Password Reset — EdisonKart',
    html: `<div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#fff;border-radius:12px;border:1px solid #e2e8f0">
      <h2 style="color:#1E3A8A;margin:0 0 16px">EdisonKart</h2>
      <p>Hi ${name || 'there'},</p>
      <p>Use this code to reset your password:</p>
      <div style="text-align:center;margin:24px 0">
        <span style="font-size:32px;letter-spacing:8px;font-weight:700;color:#F97316">${otp}</span>
      </div>
      <p style="color:#64748b;font-size:14px">If you didn't request this, ignore this email.</p>
    </div>`,
  };
}

async function sendOTP(email, otp) {
  const { subject, html } = otpTemplate('', otp);
  return sendEmail({ to: email, subject, html });
}

async function sendPasswordResetOTP(email, otp) {
  const { subject, html } = passwordResetTemplate('', otp);
  return sendEmail({ to: email, subject, html });
}

async function sendOrderConfirmation(email, order) {
  const { subject, html } = orderConfirmationTemplate('Customer', order);
  return sendEmail({ to: email, subject, html });
}

async function sendOrderUpdate(email, order, status) {
  const templates = {
    SHIPPED: shippingTemplate,
    OUT_FOR_DELIVERY: outForDeliveryTemplate,
    DELIVERED: deliveredTemplate,
    CANCELLED: cancelledTemplate,
  };

  const templateFn = templates[status];
  if (templateFn) {
    const { subject, html } = templateFn('Customer', order);
    return sendEmail({ to: email, subject, html });
  }

  return sendEmail({
    to: email,
    subject: `Order ${order.orderId} Update — ${status}`,
    html: `<p>Your order <strong>${order.orderId}</strong> status has been updated to: <strong>${status}</strong></p>`,
  });
}

module.exports = {
  sendEmail,
  sendOTP,
  sendPasswordResetOTP,
  sendOrderConfirmation,
  sendOrderUpdate,
  otpTemplate,
  orderConfirmationTemplate,
  shippingTemplate,
  outForDeliveryTemplate,
  deliveredTemplate,
  cancelledTemplate,
  passwordResetTemplate,
};
