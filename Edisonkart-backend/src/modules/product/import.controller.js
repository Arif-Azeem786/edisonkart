const Product = require('./product.model');
const Category = require('../category/category.model');
const { successResponse, errorResponse } = require('../../utils/responseFormatter');
const { scrapeProduct } = require('../../utils/scraper');
const slugify = require('../../utils/slugify');
const { uploadBufferToGridFS } = require('../../config/gridfs');
const axios = require('axios');
const crypto = require('crypto');
const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function rewriteDescription(originalDesc, productTitle) {
  if (!process.env.OPENAI_API_KEY || !originalDesc || originalDesc === 'No description available.') {
    return originalDesc || 'No description available.';
  }
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a professional ecommerce copywriter for EdisonKart, a premium online store. Rewrite product descriptions to be unique, engaging, and SEO-friendly. Keep the key features and specifications accurate. Use bullet points for features. Keep it concise (150-300 words max). Do not invent features that are not in the original.'
        },
        {
          role: 'user',
          content: `Rewrite this product description professionally and uniquely for our online store EdisonKart.\n\nProduct: ${productTitle}\n\nOriginal Description:\n${originalDesc.slice(0, 2000)}`
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });
    const rewritten = response.choices?.[0]?.message?.content?.trim();
    return rewritten || originalDesc;
  } catch (err) {
    console.error('OpenAI rewrite failed, using original:', err.message);
    return originalDesc;
  }
}

async function getOrCreateImportCategory() {
  let category = await Category.findOne({ slug: 'imported-products' });
  if (!category) {
    category = await Category.create({
      name: 'Imported Products',
      slug: 'imported-products',
      description: 'Products imported from external ecommerce platforms',
      icon: '📦',
      level: 1
    });
  }
  return category;
}

async function downloadAndStoreImages(imageUrls) {
  const imageIds = [];

  for (const url of imageUrls.slice(0, 8)) {
    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'image/*,*/*',
          'Referer': new URL(url).origin
        }
      });

      const buffer = Buffer.from(response.data);
      if (buffer.length < 1000) continue;

      const contentType = response.headers['content-type'] || 'image/jpeg';
      const ext = contentType.includes('png') ? '.png'
        : contentType.includes('webp') ? '.webp'
        : '.jpg';

      const filename = crypto.randomBytes(16).toString('hex') + ext;
      const imageId = await uploadBufferToGridFS(buffer, filename, contentType);
      imageIds.push(imageId);
    } catch (err) {
      console.error('Failed to download image:', url, err.message);
    }
  }

  return imageIds;
}

async function downloadAndStoreVideos(videoUrls) {
  const videoIds = [];

  for (const url of videoUrls.slice(0, 3)) {
    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 30000,
        maxContentLength: 100 * 1024 * 1024,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'video/*,*/*',
          'Referer': new URL(url).origin
        }
      });

      const buffer = Buffer.from(response.data);
      if (buffer.length < 10000) continue;

      const contentType = response.headers['content-type'] || 'video/mp4';
      const ext = contentType.includes('webm') ? '.webm' : '.mp4';

      const filename = crypto.randomBytes(16).toString('hex') + ext;
      const videoId = await uploadBufferToGridFS(buffer, filename, contentType);
      videoIds.push(videoId);
    } catch (err) {
      console.error('Failed to download video:', url, err.message);
    }
  }

  return videoIds;
}

const importController = {
  async importFromUrl(req, res, next) {
    try {
      const { url } = req.body;

      if (!url) {
        return errorResponse(res, 'Product URL is required', 400);
      }

      try {
        new URL(url);
      } catch {
        return errorResponse(res, 'Invalid URL format', 400);
      }

      const botPagePattern = /are you a human|captcha|verify you're human|security check|robot|blocked|access denied|please verify/i;
      const uiTitlePattern = /^add to (your )?order\.?$|^add to cart\.?$|^buy now\.?$|^description(s)?\.?$|^this is a modal window\.?$/i;

      const isFlipkartUrl = /flipkart\.com|dl\.flipkart\.com/.test(url);
      const MAX_RETRIES = isFlipkartUrl ? 2 : 3;
      let scraped = null;
      let lastError = null;

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          scraped = await scrapeProduct(url);

          const isBotPage = botPagePattern.test(scraped.title || '') || botPagePattern.test(scraped.description || '');
          const isEmptyResult = !scraped.title || scraped.title === 'Imported Product';
          const isUIText = uiTitlePattern.test((scraped.title || '').trim());

          if (isBotPage || isEmptyResult || isUIText) {
            const reason = isBotPage ? 'bot challenge' : isUIText ? 'UI text' : 'empty result';
            console.log(`Scrape attempt ${attempt}/${MAX_RETRIES} got ${reason}, ${attempt < MAX_RETRIES ? 'retrying...' : 'giving up'}`);
            lastError = reason;
            scraped = null;
            if (attempt < MAX_RETRIES) {
              await new Promise(r => setTimeout(r, 3000 + Math.random() * 4000));
            }
            continue;
          }

          break;
        } catch (err) {
          console.log(`Scrape attempt ${attempt}/${MAX_RETRIES} error: ${err.message}`);
          lastError = err.message;
          scraped = null;
          if (attempt < MAX_RETRIES) {
            await new Promise(r => setTimeout(r, 3000 + Math.random() * 4000));
          }
        }
      }

      if (!scraped) {
        let friendlyMsg;
        if (isFlipkartUrl && (lastError === 'bot challenge' || lastError?.includes?.('Could not extract'))) {
          friendlyMsg = 'Flipkart has aggressive bot protection (reCAPTCHA). A browser window was opened to try to pass it. Please try again — it may work on the second attempt. Alternatively, try using an Amazon or other product link.';
        } else if (lastError === 'bot challenge') {
          friendlyMsg = 'The site showed a security check. Please try again in a moment or use a different product link.';
        } else if (lastError === 'UI text') {
          friendlyMsg = 'Could not extract the product name from this URL. The page layout may not be supported.';
        } else {
          friendlyMsg = `Could not extract product details after ${MAX_RETRIES} attempts. The page may be protected or unsupported.`;
        }
        return errorResponse(res, friendlyMsg, 422);
      }

      // If description is mostly UI junk (modal, toggle text), treat as no description
      let description = scraped.description || '';
      const uiDescPattern = /modal window|descriptions?\s*off\s*,\s*selected|this is a modal/i;
      if (description && uiDescPattern.test(description) && description.length < 500) {
        description = '';
      }
      if (!description.trim()) description = 'No description available.';

      description = await rewriteDescription(description, scraped.title);

      const [imageIds, videoIds] = await Promise.all([
        downloadAndStoreImages(scraped.images),
        downloadAndStoreVideos(scraped.videos || [])
      ]);

      const originalPrice = Math.round(scraped.originalPrice || 999);

      const electronicsKeywords = /\b(phone|mobile|laptop|tablet|computer|pc|monitor|tv|television|headphone|earphone|earbud|speaker|camera|smartwatch|watch|charger|powerbank|power bank|printer|router|keyboard|mouse|gpu|processor|ssd|hard drive|ram|motherboard|console|playstation|xbox|nintendo|iphone|samsung|oneplus|redmi|realme|poco|nothing|macbook|ipad|airpod|bluetooth|wifi|usb|hdmi|led|lcd|oled|amoled|drone|gopro|projector|amplifier|microphone)\b/i;
      const isElectronics = electronicsKeywords.test(scraped.title) || electronicsKeywords.test(scraped.description);
      const discountPercent = isElectronics ? 0.15 : 0.10;
      const edisonkartPrice = Math.round(originalPrice * (1 - discountPercent));

      const category = await getOrCreateImportCategory();

      const baseSlug = slugify(scraped.title);
      let slug = baseSlug;
      let counter = 1;
      while (await Product.findOne({ slug })) {
        slug = `${baseSlug}-${counter++}`;
      }

      const product = await Product.create({
        name: scraped.title,
        slug,
        description,
        categoryId: category._id,
        price: originalPrice,
        discountPrice: edisonkartPrice,
        stock: 10,
        isActive: true,
        averageRating: scraped.rating || 0,
        brand: scraped.sourcePlatform,
        imageIds,
        videoIds
      });

      const storedImages = imageIds.map(id => `/api/products/image/${id}`);
      const storedVideos = videoIds.map(id => `/api/products/video/${id}`);

      const responseData = {
        _id: product._id,
        title: product.name,
        slug: product.slug,
        description: product.description,
        images: storedImages.length > 0 ? storedImages : scraped.images,
        videos: storedVideos.length > 0 ? storedVideos : (scraped.videos || []),
        originalPrice: product.price,
        edisonkartPrice: product.discountPrice,
        discountPercent: isElectronics ? 15 : 10,
        isElectronics,
        sourceLink: scraped.sourceLink,
        sourcePlatform: scraped.sourcePlatform,
        rating: product.averageRating
      };

      successResponse(res, responseData, 'Product imported successfully', 201);
    } catch (error) {
      next(error);
    }
  }
};

module.exports = importController;
