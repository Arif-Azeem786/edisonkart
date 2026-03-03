const mongoose = require('mongoose');
require('dotenv').config();

const addMockRatings = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const Product = mongoose.model('Product', new mongoose.Schema({
            averageRating: Number,
            numReviews: Number
        }, { strict: false }));

        const ratings = [4.1, 4.2, 4.3, 4.5, 3.9, 4.7, 4.4, 4.1];
        const reviewCounts = [124, 85, 230, 1500, 45, 310, 89, 1200];

        const products = await Product.find({});
        console.log(`Updating ${products.length} products...`);

        for (let i = 0; i < products.length; i++) {
            const rating = ratings[i % ratings.length];
            const reviews = reviewCounts[i % reviewCounts.length];
            
            await Product.findByIdAndUpdate(products[i]._id, {
                averageRating: rating,
                numReviews: reviews
            });
        }

        console.log('Successfully updated product ratings');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

addMockRatings();
