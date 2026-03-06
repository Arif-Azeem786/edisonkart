const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`📦 MongoDB Connected: ${conn.connection.host}`);

    // Create indexes
    await createIndexes(conn.connection.db);

  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const createIndexes = async (db) => {
  try {
    // Users collection indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ role: 1 });

    // Products collection indexes
    await db.collection('products').createIndex({ slug: 1 }, { unique: true });
    await db.collection('products').createIndex({ 
      name: 'text', 
      description: 'text' 
    });
    await db.collection('products').createIndex({ categoryId: 1 });
    await db.collection('products').createIndex({ price: 1 });
    await db.collection('products').createIndex({ stock: 1 });
    await db.collection('products').createIndex({ isActive: 1 });

    // Categories collection indexes
    await db.collection('categories').createIndex({ slug: 1 }, { unique: true });

    // Orders collection indexes
    await db.collection('orders').createIndex({ orderId: 1 }, { unique: true });
    await db.collection('orders').createIndex({ userId: 1 });
    await db.collection('orders').createIndex({ orderStatus: 1 });
    await db.collection('orders').createIndex({ paymentStatus: 1 });
    await db.collection('orders').createIndex({ deliveryBoyId: 1 });
    await db.collection('orders').createIndex({ createdAt: -1 });

    // Cart collection indexes
    await db.collection('carts').createIndex({ userId: 1 }, { unique: true });

    // Payments collection indexes
    await db.collection('payments').createIndex({ orderId: 1 });
    await db.collection('payments').createIndex({ gatewayOrderId: 1 });

    console.log('✅ Database indexes created');
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
  }
};

module.exports = connectDB;