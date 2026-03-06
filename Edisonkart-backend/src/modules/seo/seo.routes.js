const express = require('express');
const router = express.Router();
const Product = require('../product/product.model');
const Category = require('../category/category.model');

const SITE_URL = process.env.FRONTEND_URL?.split(',')[0] || 'https://edisonkart.com';

router.get('/sitemap.xml', async (req, res) => {
  try {
    const [products, categories] = await Promise.all([
      Product.find({ isActive: true }).select('slug updatedAt').lean(),
      Category.find({ isActive: true }).select('slug updatedAt').lean(),
    ]);

    const urls = [
      { loc: SITE_URL, priority: '1.0', changefreq: 'daily' },
      { loc: `${SITE_URL}/products`, priority: '0.9', changefreq: 'daily' },
      { loc: `${SITE_URL}/about`, priority: '0.5', changefreq: 'monthly' },
      { loc: `${SITE_URL}/contact`, priority: '0.5', changefreq: 'monthly' },
      { loc: `${SITE_URL}/faq`, priority: '0.4', changefreq: 'monthly' },
    ];

    for (const cat of categories) {
      urls.push({
        loc: `${SITE_URL}/products?category=${cat.slug}`,
        lastmod: cat.updatedAt?.toISOString(),
        priority: '0.7',
        changefreq: 'weekly',
      });
    }

    for (const prod of products) {
      urls.push({
        loc: `${SITE_URL}/products/${prod.slug}`,
        lastmod: prod.updatedAt?.toISOString(),
        priority: '0.8',
        changefreq: 'weekly',
      });
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    ${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    res.set('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    res.status(500).send('Error generating sitemap');
  }
});

module.exports = router;
