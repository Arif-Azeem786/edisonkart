const Razorpay = require('razorpay');
const crypto = require('crypto');

class RazorpayService {
  constructor() {
    this.keyId = process.env.RAZORPAY_KEY_ID;
    this.keySecret = process.env.RAZORPAY_KEY_SECRET;

    this.client = new Razorpay({
      key_id: this.keyId,
      key_secret: this.keySecret
    });
  }

  async createOrder(orderData) {
    const {
      orderId,
      amount,
      customerName,
      customerEmail,
      customerPhone
    } = orderData;

    try {
      const options = {
        amount: Math.round(amount * 100), // Razorpay works in paise
        currency: 'INR',
        receipt: orderId,
        notes: {
          customerName,
          customerEmail,
          customerPhone
        }
      };

      const order = await this.client.orders.create(options);
      return order;
    } catch (error) {
      console.error('Razorpay order creation failed:', error.response?.data || error);

      // Provide a clearer message when authentication fails
      if (error.response?.status === 401) {
        throw new Error('Razorpay authentication failed. Please check your KEY_ID and KEY_SECRET (live vs test) on the server.');
      }

      const errorMessage =
        error.response?.data?.error?.description ||
        error.error?.description ||
        error.message ||
        'Payment gateway error';
      throw new Error(errorMessage);
    }
  }

  async getOrderStatus(razorpayOrderId) {
    try {
      const payments = await this.client.orders.fetchPayments(razorpayOrderId);

      const successfulPayment = payments.items.find(
        (payment) => payment.status === 'captured' || payment.status === 'authorized'
      );

      return {
        order_status: successfulPayment ? 'PAID' : 'PENDING',
        raw: payments
      };
    } catch (error) {
      console.error('Razorpay order status check failed:', error);
      throw new Error('Failed to fetch payment status');
    }
  }

  verifyPaymentSignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
    try {
      const body = `${razorpayOrderId}|${razorpayPaymentId}`;
      const expectedSignature = crypto
        .createHmac('sha256', this.keySecret)
        .update(body)
        .digest('hex');

      return expectedSignature === razorpaySignature;
    } catch (error) {
      console.error('Razorpay signature verification failed:', error);
      return false;
    }
  }
}

module.exports = new RazorpayService();

