const { successResponse, errorResponse } = require('../../utils/responseFormatter');
const OpenAI = require('openai');
const jwt = require('jsonwebtoken');
const Order = require('../order/order.model');
const User = require('../user/user.model');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are "Edison", the friendly, smart, and helpful customer support assistant for **EdisonKart** — a premium e-commerce store in India.

## CORE PERSONALITY
- Warm, empathetic, helpful, and professional
- Respond like a real human support agent who genuinely cares
- Use simple, conversational language
- Be concise: 2-5 sentences for simple queries, more for complex ones
- Add a touch of friendliness with occasional emojis (😊, 🎉, 📦, ✅) — but don't overdo it

## PERSONALIZATION (VERY IMPORTANT)
- When the system provides the user's name, USE IT naturally in your replies
- Address them by their first name to make it feel personal (e.g. "Hi Rahul!", "Sure thing Priya!", "Rahul, your order is...")
- Use their name in greetings, acknowledgements, and when giving important info — but don't overuse it in every single sentence
- If no name is provided, the user is a guest — be friendly but don't use a name

## LANGUAGE RULES (VERY IMPORTANT)
- **ALWAYS reply in the SAME LANGUAGE the user writes in**
- If user writes in Hindi → reply in Hindi
- If user writes in Tamil → reply in Tamil
- If user writes in Telugu → reply in Telugu
- If user writes in Hinglish (mix of Hindi+English) → reply in Hinglish
- If user writes in any regional Indian language → reply in that language
- If user writes in English → reply in English
- NEVER switch languages unless the user does

## SMART LINKS (use these exact markdown formats when relevant)
- My Orders page: [View My Orders](/orders)
- Cart page: [Go to Cart](/cart)
- Profile/Account: [My Account](/account)
- Wishlist: [My Wishlist](/wishlist)
- Checkout: [Proceed to Checkout](/checkout)
- Contact page: [Contact Us](/contact)
- Browse products: [Shop Now](/shop)
- Home page: [Go to Home](/)
- Import product: [Import Product](/import-product)
- About us: [About EdisonKart](/about)
- FAQ: [Read FAQ](/faq)

## ORDER TRACKING
- When the system provides ORDER DATA in the conversation, use it to give accurate, specific status updates
- Format order statuses nicely: PLACED → "Order Placed 📋", CONFIRMED → "Confirmed ✅", SHIPPED → "Shipped 🚚", OUT_FOR_DELIVERY → "Out for Delivery 🏍️", DELIVERED → "Delivered ✅🎉", CANCELLED → "Cancelled ❌"
- If estimated delivery date exists, mention it
- Always offer to help with more details
- If no order data is provided and user asks about an order, ask them to check [View My Orders](/orders) or ask for the order ID

## WHAT YOU CAN HELP WITH
- Order tracking, status, cancellation, returns, refunds
- Product questions, recommendations, availability
- Shipping info, delivery times, serviceability
- Payment issues, Razorpay, COD, refunds
- Account issues, login problems, profile updates
- General store info, policies, FAQs

## WHAT YOU SHOULD NOT DO
- Never make up order IDs, tracking numbers, or prices
- Never share other customers' data
- Never promise specific refund timelines unless the data says so
- If you don't know something, honestly say so and guide them to the right place

## RESPONSE FORMAT
- Use **bold** for important info (order IDs, statuses, prices)
- Use line breaks for readability
- Include relevant page links naturally in your response
- End complex interactions asking if there's anything else you can help with`;

function extractUserId(req) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return null;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded?.userId || decoded?.id || decoded?._id || null;
  } catch { return null; }
}

async function getUserName(userId) {
  if (!userId) return null;
  try {
    const user = await User.findById(userId).select('name').lean();
    return user?.name || null;
  } catch { return null; }
}

async function lookupOrders(userId, userMessage) {
  if (!userId) return null;

  const lowerMsg = userMessage.toLowerCase();
  const wantsOrder = /order|track|deliver|ship|cancel|return|refund|status|kahan|kidhar|kab|parcel|aaya|aya|milega|mila|pahunch|dispatch|aaega|aayega|gaya|bheja/i.test(lowerMsg);
  if (!wantsOrder) return null;

  const orderIdMatch = userMessage.match(/(?:order\s*(?:id|#|no\.?)?[:\s]*)([A-Z0-9-]{6,})/i)
    || userMessage.match(/\b(ORD-[A-Z0-9]+)\b/i)
    || userMessage.match(/#([A-Z0-9-]{6,})/i);

  try {
    if (orderIdMatch) {
      const searchId = orderIdMatch[1].trim();
      const order = await Order.findOne({
        userId,
        orderId: { $regex: new RegExp(searchId, 'i') }
      }).populate('items.productId', 'name slug').lean();

      if (order) return formatOrderData([order]);
      return `No order found matching "${searchId}". Please double-check the order ID.`;
    }

    const orders = await Order.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('items.productId', 'name slug')
      .lean();

    if (!orders.length) return 'You have no orders yet. Start shopping at [Shop Now](/shop)!';
    return formatOrderData(orders);
  } catch (err) {
    console.error('Order lookup failed:', err.message);
    return null;
  }
}

function formatOrderData(orders) {
  const statusEmoji = {
    PLACED: '📋 Placed', CONFIRMED: '✅ Confirmed', SHIPPED: '🚚 Shipped',
    OUT_FOR_DELIVERY: '🏍️ Out for Delivery', DELIVERED: '✅🎉 Delivered',
    CANCELLED: '❌ Cancelled', RETURN_REQUESTED: '↩️ Return Requested',
    RETURNED: '↩️ Returned', REPLACEMENT_REQUESTED: '🔄 Replacement Requested',
    REPLACED: '🔄 Replaced'
  };

  const lines = orders.map(o => {
    const items = o.items?.map(i => i.nameSnapshot || i.productId?.name || 'Item').join(', ') || 'Items';
    const status = statusEmoji[o.orderStatus] || o.orderStatus;
    const date = new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const est = o.estimatedDeliveryDate
      ? ` | Expected: ${new Date(o.estimatedDeliveryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
      : '';

    let lastUpdate = '';
    if (o.statusHistory?.length) {
      const last = o.statusHistory[o.statusHistory.length - 1];
      lastUpdate = last.comment ? ` — "${last.comment}"` : '';
    }

    return `• **${o.orderId}** — ${status}${est}\n  Items: ${items.slice(0, 80)}\n  Total: ₹${o.totalAmount} | Date: ${date}${lastUpdate}`;
  });

  return `ORDER DATA FOR AI (use this to answer):\n${lines.join('\n\n')}`;
}

const chatController = {
  async sendMessage(req, res, next) {
    try {
      const { message, history = [] } = req.body;

      if (!message || typeof message !== 'string') {
        return errorResponse(res, 'Message is required', 400);
      }
      const trimmed = message.trim();
      if (!trimmed) return errorResponse(res, 'Message cannot be empty', 400);

      if (!process.env.OPENAI_API_KEY) {
        return successResponse(res, {
          reply: "Chat is not configured right now. Please use the [Contact Us](/contact) page. We're sorry for the inconvenience!",
        });
      }

      const userId = extractUserId(req);
      const [orderContext, userName] = await Promise.all([
        lookupOrders(userId, trimmed),
        getUserName(userId),
      ]);

      const messages = [{ role: 'system', content: SYSTEM_PROMPT }];

      if (Array.isArray(history) && history.length > 0) {
        for (const m of history.slice(-20)) {
          if (!m.role || !m.content) continue;
          messages.push({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: String(m.content).slice(0, 2000)
          });
        }
      }

      let userContent = trimmed.slice(0, 2000);

      const systemNotes = [];
      if (userName) {
        systemNotes.push(`User's name is "${userName}". Address them by their first name naturally.`);
      }
      if (orderContext) {
        systemNotes.push(orderContext);
      }
      if (!userId) {
        systemNotes.push('User is NOT logged in. If they ask about orders, tell them to log in first and provide the link to login.');
      }
      if (systemNotes.length) {
        userContent += `\n\n[SYSTEM CONTEXT — NOT from user, use to answer accurately]:\n${systemNotes.join('\n')}`;
      }

      messages.push({ role: 'user', content: userContent });

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 700,
        temperature: 0.7,
      });

      const reply = response.choices?.[0]?.message?.content?.trim();

      if (!reply) {
        return successResponse(res, {
          reply: "I couldn't generate a reply right now. Please try again or visit [Contact Us](/contact).",
        });
      }

      successResponse(res, { reply });
    } catch (error) {
      console.error('Chat error:', error?.message);
      const status = error?.status || error?.response?.status;
      if (status === 429) {
        return successResponse(res, {
          reply: "We've hit our chat limit for the moment. Please try again in a minute or visit [Contact Us](/contact).",
        });
      }
      const isKeyError = /API key|invalid|401|403|quota/i.test(String(error?.message || ''));
      const reply = isKeyError
        ? "Chat is temporarily unavailable. Please use the [Contact Us](/contact) page for support."
        : "Something went wrong on our end. Please try again or visit [Contact Us](/contact).";
      successResponse(res, { reply });
    }
  }
};

module.exports = chatController;
