const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const dotenv = require('dotenv')
const path = require('path')

dotenv.config({ path: path.join(__dirname, '../../.env') })

const User = require('../modules/user/user.model')
const Category = require('../modules/category/category.model')
const Product = require('../modules/product/product.model')
const Order = require('../modules/order/order.model')
const Payment = require('../modules/payment/payment.model')

// ─────────────────────────────────────────────
// Helper: create a URL-safe slug from a string
// ─────────────────────────────────────────────
const slugify = (str) =>
    str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

// ─────────────────────────────────────────────
// Category tree definition
// Each subcategory can optionally have `children` (Level 3)
// ─────────────────────────────────────────────
const CATEGORIES = [
    {
        name: 'Electronics',
        icon: '🔌',
        description: 'Gadgets, devices and consumer electronics',
        children: [
            { name: 'Mobiles', children: ['Smartphones', 'Feature Phones', 'Refurbished Phones'] },
            { name: 'Laptops', children: ['Gaming Laptops', 'Ultrabooks', 'Business Laptops'] },
            { name: 'Tablets', children: ['Android Tablets', 'iPads', 'Windows Tablets'] },
            { name: 'Cameras', children: ['DSLR Cameras', 'Mirrorless Cameras', 'Action Cameras'] },
            { name: 'Audio', children: ['Headphones', 'Earbuds', 'Speakers', 'Soundbars'] },
            { name: 'Wearables', children: ['Smartwatches', 'Fitness Bands', 'Smart Glasses'] },
            { name: 'Smart Devices', children: ['Smart TVs', 'Smart Home Hubs', 'Smart Bulbs'] },
            { name: 'Gaming Consoles', children: ['PlayStation', 'Xbox', 'Nintendo', 'PC Gaming'] },
        ]
    },
    {
        name: 'Fashion',
        icon: '👕',
        description: 'Clothing, footwear and accessories for everyone',
        children: [
            { name: "Men's Fashion", children: ['Shirts', 'T-Shirts', 'Jeans', 'Ethnic Wear', 'Suits'] },
            { name: "Women's Fashion", children: ['Kurtas', 'Sarees', 'Dresses', 'Western Wear', 'Tops'] },
            { name: "Kids' Fashion", children: ['Boys Clothing', 'Girls Clothing', 'Baby Clothing'] },
            { name: 'Footwear', children: ['Sneakers', 'Formal Shoes', 'Sandals', 'Heels', 'Sports Shoes'] },
            { name: 'Watches', children: ['Analog Watches', 'Digital Watches', 'Luxury Watches'] },
            { name: 'Bags', children: ['Backpacks', 'Handbags', 'Travel Bags', 'Wallets'] },
            { name: 'Accessories', children: ['Sunglasses', 'Belts', 'Jewellery', 'Scarves', 'Caps'] },
        ]
    },
    {
        name: 'Home & Furniture',
        icon: '🏠',
        description: 'Furniture, decor and everything for your home',
        children: [
            { name: 'Living Room Furniture', children: ['Sofas', 'Coffee Tables', 'TV Units', 'Bookshelves'] },
            { name: 'Bedroom Furniture', children: ['Beds', 'Wardrobes', 'Dressing Tables', 'Mattresses'] },
            { name: 'Kitchen & Dining', children: ['Dining Tables', 'Chairs', 'Kitchen Shelves', 'Cookware'] },
            { name: 'Home Decor', children: ['Wall Art', 'Clocks', 'Vases', 'Candles', 'Cushions'] },
            { name: 'Lighting', children: ['Ceiling Lights', 'Table Lamps', 'LED Strips', 'Outdoor Lights'] },
            { name: 'Storage', children: ['Cabinets', 'Drawers', 'Shoe Racks', 'Organisers'] },
        ]
    },
    {
        name: 'Appliances',
        icon: '❄️',
        description: 'Home and kitchen appliances',
        children: [
            { name: 'Air Conditioners', children: ['Split ACs', 'Window ACs', 'Portable ACs'] },
            { name: 'Refrigerators', children: ['Single Door', 'Double Door', 'Side by Side', 'French Door'] },
            { name: 'Washing Machines', children: ['Front Load', 'Top Load', 'Semi-Automatic'] },
            { name: 'Microwave Ovens', children: ['Solo Microwave', 'Grill Microwave', 'Convection Microwave'] },
            { name: 'Water Purifiers', children: ['RO Purifiers', 'UV Purifiers', 'Gravity Purifiers'] },
            { name: 'Small Appliances', children: ['Mixer Grinders', 'Toasters', 'Irons', 'Vacuum Cleaners', 'Air Fryers'] },
        ]
    },
    {
        name: 'Beauty & Personal Care',
        icon: '💄',
        description: 'Makeup, skincare, haircare and grooming products',
        children: [
            { name: 'Makeup', children: ['Foundation', 'Lipstick', 'Eye Makeup', 'Blush & Bronzer'] },
            { name: 'Skincare', children: ['Moisturisers', 'Serums', 'Sunscreens', 'Face Wash', 'Toners'] },
            { name: 'Haircare', children: ['Shampoos', 'Conditioners', 'Hair Oils', 'Hair Styling'] },
            { name: 'Grooming', children: ['Razors', 'Trimmers', 'Shaving Creams', 'Aftershave'] },
            { name: 'Fragrances', children: ['Perfumes', 'Deodorants', 'Body Mists', 'Attars'] },
        ]
    },
    {
        name: 'Sports & Fitness',
        icon: '🏋️',
        description: 'Gym equipment, sports gear and fitness accessories',
        children: [
            { name: 'Gym Equipment', children: ['Dumbbells', 'Treadmills', 'Resistance Bands', 'Yoga Mats'] },
            { name: 'Sports Shoes', children: ['Running Shoes', 'Cricket Shoes', 'Football Boots', 'Training Shoes'] },
            { name: 'Outdoor Sports', children: ['Cricket', 'Football', 'Badminton', 'Tennis', 'Swimming'] },
            { name: 'Yoga', children: ['Yoga Mats', 'Blocks', 'Straps', 'Bolsters'] },
            { name: 'Cycling', children: ['Cycles', 'Helmets', 'Cycling Accessories', 'Cycle Locks'] },
        ]
    },
    {
        name: 'Toys, Baby & Kids',
        icon: '🧸',
        description: 'Toys, baby care and kids essentials',
        children: [
            { name: 'Baby Care', children: ['Diapers', 'Baby Wipes', 'Baby Food', 'Baby Monitors', 'Prams'] },
            { name: 'Toys', children: ['Action Figures', 'Board Games', 'Building Blocks', 'Educational Toys', 'RC Toys'] },
            { name: 'School Supplies', children: ['Stationery', 'Lunch Boxes', 'School Bags', 'Art Supplies'] },
            { name: "Kids' Clothing", children: ['Infants', 'Toddlers', 'Boys (2-14)', 'Girls (2-14)'] },
        ]
    },
    {
        name: 'Grocery',
        icon: '🛒',
        description: 'Daily groceries, snacks, beverages and household essentials',
        children: [
            { name: 'Snacks', children: ['Chips', 'Biscuits', 'Namkeen', 'Chocolates', 'Dry Fruits'] },
            { name: 'Beverages', children: ['Tea & Coffee', 'Juices', 'Soft Drinks', 'Energy Drinks', 'Milk'] },
            { name: 'Household Essentials', children: ['Cleaning Products', 'Detergents', 'Dishwash', 'Air Fresheners'] },
            { name: 'Personal Care Essentials', children: ['Soaps', 'Hand Wash', 'Sanitisers', 'Tissues'] },
        ]
    },
    {
        name: 'Automotive',
        icon: '🚗',
        description: 'Car accessories, bike accessories and automotive tools',
        children: [
            { name: 'Car Accessories', children: ['Car Covers', 'Seat Covers', 'Dash Cams', 'Car Chargers', 'Car Fresheners'] },
            { name: 'Bike Accessories', children: ['Bike Covers', 'Bike Locks', 'Bike Lights', 'Bike Stands'] },
            { name: 'Helmets', children: ['Full Face Helmets', 'Open Face Helmets', 'Kids Helmets'] },
            { name: 'Tools', children: ['Tyre Inflators', 'Jump Starters', 'Tool Kits', 'Cleaning Kits'] },
        ]
    },
    {
        name: 'Books & Education',
        icon: '📚',
        description: 'Books, study material and educational resources',
        children: [
            { name: 'Academic Books', children: ['Engineering', 'Medical', 'Commerce', 'Science', 'Arts'] },
            { name: 'Competitive Exams', children: ['UPSC', 'JEE', 'NEET', 'Banking', 'SSC'] },
            { name: 'Novels', children: ['Fiction', 'Non-Fiction', 'Mystery', 'Romance', 'Sci-Fi'] },
            { name: "Children's Books", children: ['Picture Books', 'Story Books', 'Activity Books'] },
            { name: 'Stationery', children: ['Pens', 'Notebooks', 'Markers', 'Files & Folders'] },
        ]
    },
]

const seedDatabase = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI)
        console.log('📦 Connected to MongoDB...')

        // ── Clear DB ──
        console.log('\n🗑️  Clearing Database...')
        await User.deleteMany({})
        await Category.deleteMany({})
        await Product.deleteMany({})
        await Order.deleteMany({})
        await Payment.deleteMany({})

        try {
            const gridfsBucket = new mongoose.mongo.GridFSBucket(conn.connection.db, { bucketName: 'productImages' })
            const files = await gridfsBucket.find().toArray()
            for (const file of files) await gridfsBucket.delete(file._id)
            if (files.length > 0) console.log(`🗑️  Cleared ${files.length} existing images`)
        } catch (e) {
            console.log('GridFS clean skipped.')
        }
        console.log('✅ Database cleared')

        // ── Admin User ──
        console.log('\n👤 Creating Admin User...')
        await User.create({
            name: 'Admin User',
            email: 'admin@edisonkart.com',
            password: 'Admin@123',
            role: 'ADMIN',
            isVerified: true,
            addresses: [{
                name: 'Admin Office',
                phone: '+91 98765 43210',
                addressLine1: '123 Business Park',
                addressLine2: 'Andheri East',
                city: 'Mumbai',
                state: 'Maharashtra',
                pincode: '400093',
                isDefault: true
            }]
        })
        console.log('✅ Admin User Created')

        // ── Categories (Level 1 only) ──
        console.log('\n📂 Seeding Categories...')

        for (const mainCat of CATEGORIES) {
            await Category.create({
                name: mainCat.name,
                slug: slugify(mainCat.name),
                icon: mainCat.icon,
                description: mainCat.description,
                level: 1,
                parent: null,
            })
            console.log(`  ✅ ${mainCat.icon}  ${mainCat.name}`)
        }

        console.log(`\n✅ Created ${CATEGORIES.length} categories`)
        console.log('\n✨ Database Seeding Completed Successfully!')
        console.log('\nLogin Credentials:')
        console.log('   Admin: admin@edisonkart.com / Admin@123')

        process.exit(0)
    } catch (error) {
        console.error('\n❌ Seeding Error:', error)
        process.exit(1)
    }
}

seedDatabase()

