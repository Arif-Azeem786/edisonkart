require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');
const Order = require('./src/modules/order/order.model');
const fs = require('fs');

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const result = await Order.aggregate([
    {
      $match: {
        $or: [
          { paymentStatus: 'PAID', orderStatus: { $ne: 'CANCELLED' } },
          { orderStatus: 'DELIVERED' }
        ]
      }
    },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } }
  ]);
  
  fs.writeFileSync('output_new.json', JSON.stringify({ New_Revenue: result }, null, 2));

  mongoose.disconnect();
}
test();
