const Order = require('../order/order.model');
const Product = require('../product/product.model');
const User = require('../user/user.model');
const { errorResponse } = require('../../utils/responseFormatter');

function toCsv(headers, rows) {
  const escape = (val) => {
    const str = String(val ?? '');
    return str.includes(',') || str.includes('"') || str.includes('\n')
      ? `"${str.replace(/"/g, '""')}"` : str;
  };
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map(h => escape(row[h])).join(','));
  }
  return lines.join('\n');
}

const exportController = {
  async exportOrders(req, res, next) {
    try {
      const orders = await Order.find().sort({ createdAt: -1 }).limit(5000).lean();
      const rows = orders.map(o => ({
        'Order ID': o.orderId,
        'Status': o.orderStatus,
        'Total': o.totalAmount,
        'Payment': o.paymentMethod,
        'Payment Status': o.paymentStatus,
        'Items': (o.items || []).length,
        'Date': new Date(o.createdAt).toISOString().split('T')[0],
      }));
      const csv = toCsv(['Order ID', 'Status', 'Total', 'Payment', 'Payment Status', 'Items', 'Date'], rows);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=orders.csv');
      res.send(csv);
    } catch (error) {
      next(error);
    }
  },

  async exportProducts(req, res, next) {
    try {
      const products = await Product.find().sort({ createdAt: -1 }).limit(5000).lean();
      const rows = products.map(p => ({
        'Name': p.name,
        'Slug': p.slug,
        'Price': p.price,
        'Discount Price': p.discountPrice || '',
        'Stock': p.stock,
        'Active': p.isActive ? 'Yes' : 'No',
        'Flash Sale': p.isFlashSale ? 'Yes' : 'No',
        'Created': new Date(p.createdAt).toISOString().split('T')[0],
      }));
      const csv = toCsv(['Name', 'Slug', 'Price', 'Discount Price', 'Stock', 'Active', 'Flash Sale', 'Created'], rows);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=products.csv');
      res.send(csv);
    } catch (error) {
      next(error);
    }
  },

  async exportUsers(req, res, next) {
    try {
      const users = await User.find().select('-password -resetPasswordOTP -otp').sort({ createdAt: -1 }).limit(5000).lean();
      const rows = users.map(u => ({
        'Name': u.name,
        'Email': u.email,
        'Role': u.role,
        'Verified': u.isVerified ? 'Yes' : 'No',
        'Joined': new Date(u.createdAt).toISOString().split('T')[0],
      }));
      const csv = toCsv(['Name', 'Email', 'Role', 'Verified', 'Joined'], rows);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=users.csv');
      res.send(csv);
    } catch (error) {
      next(error);
    }
  },
};

module.exports = exportController;
