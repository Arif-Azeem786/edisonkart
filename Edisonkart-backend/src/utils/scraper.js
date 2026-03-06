const puppeteer = require('puppeteer');
const axios = require('axios');

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Gecko/20100101 Firefox/132.0',
];

const GENERIC_SELECTORS = {
  title: [
    'h1[itemprop="name"]', 'h1', '[class*="product-title"]', '[class*="product-name"]',
    '[class*="ProductName"]', '[data-testid="product-title"]', '[itemprop="name"]',
    'meta[property="og:title"]',
  ],
  price: [
    '[itemprop="price"]', '[class*="selling-price"]', '[class*="sale-price"]',
    '[class*="offer-price"]', '[class*="Price"]:not([class*="old"]):not([class*="strike"])',
    '[class*="price"]:not([class*="old"]):not([class*="strike"])',
    '[data-testid="price"]', 'meta[property="product:price:amount"]',
  ],
  images: [
    '[class*="product"] img[src*="http"]', '[class*="gallery"] img', '[class*="image-grid"] img',
    '[itemprop="image"]', 'meta[property="og:image"]', '[class*="slider"] img',
    'img[class*="product"]', '#product-image img',
  ],
  rating: ['[itemprop="ratingValue"]', '[class*="rating"]', '[class*="star"]'],
  description: [
    '[itemprop="description"]', '[class*="description"]', '[class*="product-detail"]',
    'meta[property="og:description"]',
  ],
};

const PLATFORM_CONFIGS = {
  amazon: {
    match: (url) => /amazon\.(in|com|co\.\w+)/.test(url),
    name: 'Amazon',
    key: 'amazon',
    selectors: { title: [], price: [], images: [], rating: [], description: [] }
  },
  flipkart: {
    match: (url) => /flipkart\.com|dl\.flipkart\.com/.test(url),
    name: 'Flipkart',
    key: 'flipkart',
    selectors: { title: [], price: [], images: [], rating: [], description: [] }
  },
  myntra: {
    match: (url) => /myntra\.com/.test(url),
    name: 'Myntra',
    selectors: {
      title: ['h1.pdp-title', 'h1.pdp-name', '.pdp-product-description .pdp-title', '.pdp-product-description .pdp-name', 'h1'],
      price: ['span.pdp-price strong', '.pdp-discount-container span', '.pdp-price .pdp-mrp', 'span.pdp-mrp s', '[class*="price-container"] [class*="price"]'],
      images: ['.image-grid-image', '.image-grid-imageContainer img', '.pdp-image img', 'img[class*="image-grid"]', '.image-grid-col img', 'picture img'],
      rating: ['.index-overallRating div:first-child', '.pdp-ratings div', '[class*="rating"] span'],
      description: ['.pdp-product-description-content', '.pdp-description-content', '[class*="product-description"]', '[class*="pdp-description"]']
    }
  },
  savana: { match: (url) => /savana|savanastores?\.(com|in)/i.test(url), name: 'Savana', selectors: GENERIC_SELECTORS },
  purple: { match: (url) => /purple\.(com|in|co\.in)/i.test(url), name: 'Purple', selectors: GENERIC_SELECTORS },
  ajio: { match: (url) => /ajio\.com/.test(url), name: 'Ajio', selectors: GENERIC_SELECTORS },
  nykaa: { match: (url) => /nykaa\.(com|in)/.test(url), name: 'Nykaa', selectors: GENERIC_SELECTORS },
  snitch: { match: (url) => /snitch\.(com|co\.in)/.test(url), name: 'Snitch', selectors: GENERIC_SELECTORS },
  bananaclub: { match: (url) => /bananaclub\.(com|in|co\.in)/i.test(url), name: 'Banana Club', selectors: GENERIC_SELECTORS },
  tataneu: { match: (url) => /tataneu\.com/.test(url), name: 'Tata Neu', selectors: GENERIC_SELECTORS },
  tira: { match: (url) => /tira\.(com|in|beauty)/.test(url), name: 'Tira', selectors: GENERIC_SELECTORS },
  shopsy: { match: (url) => /shopsy\.(com|in)/.test(url), name: 'Shopsy', selectors: GENERIC_SELECTORS },
  snapdeal: { match: (url) => /snapdeal\.com/.test(url), name: 'Snapdeal', selectors: GENERIC_SELECTORS },
  firstcry: { match: (url) => /firstcry\.com/.test(url), name: 'Firstcry', selectors: GENERIC_SELECTORS },
  zara: { match: (url) => /zara\.com/.test(url), name: 'Zara', selectors: GENERIC_SELECTORS },
  max: { match: (url) => /maxfashion\.(com|in)/.test(url), name: 'Max', selectors: GENERIC_SELECTORS },
  croma: { match: (url) => /croma\.com/.test(url), name: 'Croma', selectors: GENERIC_SELECTORS },
  reliancedigital: { match: (url) => /reliancedigital\.(com|in)/.test(url), name: 'Reliance Digital', selectors: GENERIC_SELECTORS },
  tatacliq: { match: (url) => /tatacliq\.com/.test(url), name: 'Tata Cliq', selectors: GENERIC_SELECTORS },
  refurbed: { match: (url) => /refurbed\.(com|in|co\.\w+)/.test(url), name: 'Refurbed', selectors: GENERIC_SELECTORS },
  jiomart: { match: (url) => /jiomart\.com/.test(url), name: 'Jiomart', selectors: GENERIC_SELECTORS },
  generic: { match: () => true, name: 'Other', selectors: GENERIC_SELECTORS }
};

function detectPlatform(url) {
  for (const [key, config] of Object.entries(PLATFORM_CONFIGS)) {
    if (key !== 'generic' && config.match(url)) return { key, ...config };
  }
  return { key: 'generic', ...PLATFORM_CONFIGS.generic };
}

function parsePrice(priceText) {
  if (!priceText) return null;
  const cleaned = priceText.replace(/[^0-9.]/g, '');
  const num = parseFloat(cleaned);
  if (isNaN(num)) return null;
  return Math.round(num);
}

function parseRating(ratingText) {
  if (!ratingText) return 0;
  const match = ratingText.match(/([\d.]+)/);
  if (match) { const val = parseFloat(match[1]); return val > 5 ? 5 : val; }
  return 0;
}

function randomDelay(min = 800, max = 2000) {
  return new Promise(r => setTimeout(r, min + Math.random() * (max - min)));
}

async function applyStealthMeasures(page) {
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    Object.defineProperty(navigator, 'plugins', {
      get: () => [
        { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
        { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai', description: '' },
        { name: 'Native Client', filename: 'internal-nacl-plugin', description: '' },
      ],
    });
    Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en', 'hi'] });
    Object.defineProperty(navigator, 'platform', { get: () => 'Win32' });
    Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 });
    Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 });
    window.chrome = { runtime: {}, loadTimes: () => ({}), csi: () => ({}) };
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters) =>
      parameters.name === 'notifications'
        ? Promise.resolve({ state: Notification.permission })
        : originalQuery(parameters);
    Object.defineProperty(navigator, 'maxTouchPoints', { get: () => 0 });
    const getParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function (param) {
      if (param === 37445) return 'Intel Inc.';
      if (param === 37446) return 'Intel Iris OpenGL Engine';
      return getParameter.call(this, param);
    };
  });
}

async function waitForCaptchaResolution(page, maxWaitMs = 15000) {
  const startTime = Date.now();
  while (Date.now() - startTime < maxWaitMs) {
    const isCaptcha = await page.evaluate(() => {
      const title = document.title || '';
      const body = document.body?.innerText?.substring(0, 300) || '';
      return /reCAPTCHA|captcha|are you a human|security check/i.test(title + ' ' + body);
    }).catch(() => false);

    if (!isCaptcha) return true;

    await randomDelay(1500, 3000);

    try {
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 3000 });
      return true;
    } catch (_) {}
  }
  return false;
}

async function simulateHumanBehavior(page) {
  try {
    await page.mouse.move(200 + Math.random() * 400, 300 + Math.random() * 200);
    await randomDelay(300, 800);
    await page.mouse.move(500 + Math.random() * 300, 400 + Math.random() * 200);
    await randomDelay(200, 500);
    await page.evaluate(() => window.scrollBy(0, 300 + Math.random() * 400));
    await randomDelay(500, 1200);
    await page.evaluate(() => window.scrollBy(0, 200 + Math.random() * 300));
    await randomDelay(300, 800);
  } catch (_) {}
}

async function scrapeFlipkart(page) {
  return await page.evaluate(() => {
    function getMeta(property) {
      const el = document.querySelector(`meta[property="${property}"], meta[name="${property}"]`);
      return el ? el.getAttribute('content')?.trim() : '';
    }

    let title = '';
    const titleCandidates = document.querySelectorAll('h1 span, h1, [class*="title"]');
    for (const el of titleCandidates) {
      const t = el.textContent?.trim();
      if (t && t.length > 5 && t.length < 300) { title = t; break; }
    }
    if (!title) title = getMeta('og:title') || document.title?.split('-')[0]?.trim() || '';

    let priceText = '';
    const allElements = document.querySelectorAll('div, span');
    for (const el of allElements) {
      const text = el.textContent?.trim();
      if (text && /^₹[\d,]+$/.test(text) && !priceText) { priceText = text; break; }
    }
    if (!priceText) {
      for (const el of allElements) {
        const text = el.textContent?.trim();
        if (text && text.startsWith('₹') && text.length < 15) { priceText = text; break; }
      }
    }

    const images = new Set();
    const allImages = document.querySelectorAll('img');
    for (const img of allImages) {
      const src = img.getAttribute('src') || '';
      if (src.includes('rukminim') && !src.includes('icon') && !src.includes('logo')) {
        const highRes = src.replace(/\/\d+\/\d+\//g, '/800/800/').replace(/q=\d+/, 'q=90');
        images.add(highRes);
      }
    }
    const ogImage = getMeta('og:image');
    if (ogImage && ogImage.includes('rukminim')) {
      images.add(ogImage.replace(/\/\d+\/\d+\//g, '/800/800/').replace(/q=\d+/, 'q=90'));
    }

    let ratingText = '';
    const ratingElements = document.querySelectorAll('div, span');
    for (const el of ratingElements) {
      const t = el.textContent?.trim();
      if (t && /^\d\.\d$/.test(t)) {
        const parent = el.parentElement;
        const parentText = parent?.textContent || '';
        if (parentText.includes('Rating') || parentText.includes('star') || parent?.querySelector('svg, img[src*="star"]')) {
          ratingText = t; break;
        }
      }
    }
    if (!ratingText) {
      for (const el of ratingElements) {
        const t = el.textContent?.trim();
        if (t && /^\d\.\d$/.test(t) && el.closest('[class*="rating"], [class*="Rating"]')) {
          ratingText = t; break;
        }
      }
    }

    const descParts = [];
    const descMeta = getMeta('og:description');
    if (descMeta) descParts.push(descMeta);
    const allTextBlocks = document.querySelectorAll('div, p, li, td');
    const seen = new Set();
    for (const el of allTextBlocks) {
      if (el.children.length > 3) continue;
      const text = el.textContent?.trim();
      if (text && text.length > 30 && text.length < 500 && !seen.has(text)) {
        const lowerText = text.toLowerCase();
        if (lowerText.includes('description') || lowerText.includes('highlight') ||
            lowerText.includes('feature') || lowerText.includes('specification') ||
            el.closest('[class*="description"], [class*="highlight"], [class*="spec"]')) {
          seen.add(text); descParts.push(text);
          if (descParts.length >= 5) break;
        }
      }
    }

    return {
      title, priceText,
      images: Array.from(images).slice(0, 6),
      ratingText,
      description: descParts.join('\n\n').slice(0, 3000)
    };
  });
}

async function scrapeAmazon(page) {
  return await page.evaluate(() => {
    function getMeta(property) {
      const el = document.querySelector(`meta[property="${property}"], meta[name="${property}"]`);
      return el ? el.getAttribute('content')?.trim() : '';
    }

    // Title — use #productTitle specifically, never accessibility text
    let title = '';
    const titleEl = document.querySelector('span#productTitle, #productTitle');
    if (titleEl) {
      const t = titleEl.textContent?.trim();
      if (t && !/keyboard|shortcut|summary|presents key|product information/i.test(t)) {
        title = t;
      }
    }
    if (!title) {
      const ogTitle = getMeta('og:title');
      if (ogTitle) {
        title = ogTitle.replace(/\s*[-:|].*Amazon\.\w+.*$/i, '').trim();
      }
    }
    if (!title) {
      const dt = document.title || '';
      title = dt.split(/\s*[-:|]\s*Amazon/i)[0]?.trim() || dt.split(/[-:|]/)[0]?.trim() || '';
    }

    // Price
    let priceText = '';
    const priceSelectors = [
      '.a-price .a-offscreen',
      '#corePrice_feature_div .a-offscreen',
      '#corePriceDisplay_desktop_feature_div .a-offscreen',
      '#priceblock_dealprice',
      '#priceblock_ourprice',
      '#tp_price_block_total_price_ww .a-offscreen',
      '.a-price-whole',
    ];
    for (const sel of priceSelectors) {
      const el = document.querySelector(sel);
      if (el) {
        const t = el.textContent?.trim();
        if (t && /[\d,]+/.test(t)) { priceText = t; break; }
      }
    }

    // Images — extract from JS data (Amazon stores all images in script variables)
    const images = new Set();

    // Strategy 1: Parse the entire page HTML for hiRes image URLs
    const fullHtml = document.documentElement.innerHTML || '';
    const hiResRe = /"hiRes"\s*:\s*"(https?:\/\/m\.media-amazon\.com\/images\/I\/[^"]+)"/g;
    let hiMatch;
    while ((hiMatch = hiResRe.exec(fullHtml)) !== null) {
      images.add(hiMatch[1]);
    }

    // Strategy 2: Try "large" URLs if no hiRes found
    if (images.size === 0) {
      const largeRe = /"large"\s*:\s*"(https?:\/\/m\.media-amazon\.com\/images\/I\/[^"]+)"/g;
      let lMatch;
      while ((lMatch = largeRe.exec(fullHtml)) !== null) {
        images.add(lMatch[1]);
      }
    }

    // Strategy 3: data-a-dynamic-image on the landing image
    if (images.size === 0) {
      const landingImg = document.querySelector('#landingImage, #imgTagWrapperId img');
      if (landingImg) {
        const dynImg = landingImg.getAttribute('data-a-dynamic-image');
        if (dynImg) {
          try {
            const parsed = JSON.parse(dynImg);
            Object.keys(parsed)
              .sort((a, b) => (parsed[b]?.[0] || 0) - (parsed[a]?.[0] || 0))
              .forEach((url) => images.add(url));
          } catch (_) {}
        }
        const oldHiRes = landingImg.getAttribute('data-old-hires');
        if (oldHiRes) images.add(oldHiRes);
        if (images.size === 0) {
          const src = landingImg.getAttribute('src');
          if (src && src.startsWith('http')) images.add(src);
        }
      }
    }

    // Strategy 4: alt images thumbnails upscaled
    if (images.size < 3) {
      document.querySelectorAll('#altImages img, .imgTagWrapper img').forEach((img) => {
        const src = img.getAttribute('src') || '';
        if (src.includes('images/I/') && !src.includes('sprite') && !src.includes('grey-pixel')) {
          const upscaled = src.replace(/\._[A-Z]{2}\d+[_,].*\./, '.').replace(/\._[A-Z]+\d+_\./, '.');
          images.add(upscaled);
        }
      });
    }

    // Last resort: og:image
    if (images.size === 0) {
      const ogImage = getMeta('og:image');
      if (ogImage) images.add(ogImage);
    }

    // Rating
    let ratingText = '';
    const ratingEl = document.querySelector('#acrPopover .a-icon-alt, span[data-hook="rating-out-of-text"]');
    if (ratingEl) ratingText = ratingEl.textContent?.trim() || '';

    // Description — combine feature bullets + product description
    const junkPattern = /frequently bought|add to cart|buy now|sponsored|keyboard shortcut|customers also|similar item/i;
    const descParts = [];
    document.querySelectorAll('#feature-bullets .a-list-item').forEach((el) => {
      const t = el.textContent?.trim();
      if (t && t.length > 5 && t.length < 500
          && !/^\s*(›|Show|See|Click)\s/i.test(t)
          && !junkPattern.test(t)) {
        descParts.push('• ' + t);
      }
    });
    const prodDesc = document.querySelector('#productDescription');
    if (prodDesc) {
      const t = prodDesc.textContent?.trim();
      if (t && t.length > 20 && !junkPattern.test(t)) descParts.push(t);
    }
    // A+ content
    if (descParts.length < 2) {
      const aplus = document.querySelector('#aplus_feature_div');
      if (aplus) {
        const paras = aplus.querySelectorAll('p, h3, h4');
        paras.forEach((p) => {
          const t = p.textContent?.trim();
          if (t && t.length > 15 && t.length < 500 && !junkPattern.test(t)) {
            descParts.push(t);
          }
        });
      }
    }
    // Meta description fallback
    if (descParts.length === 0) {
      const metaDesc = getMeta('og:description') || getMeta('description');
      if (metaDesc) descParts.push(metaDesc);
    }

    return {
      title,
      priceText,
      images: Array.from(images).filter((u) => u.startsWith('http')).slice(0, 8),
      ratingText,
      description: descParts.join('\n').slice(0, 3000),
    };
  });
}

async function scrapeWithSelectors(page, selectors) {
  return await page.evaluate((sels) => {
    function getText(selectorList) {
      for (const sel of selectorList) {
        const el = document.querySelector(sel);
        if (el) {
          if (el.tagName === 'META') return el.getAttribute('content') || '';
          const text = el.textContent?.trim();
          if (text) return text;
        }
      }
      return '';
    }
    function getImages(selectorList) {
      const images = new Set();
      // Try each selector group
      for (const sel of selectorList) {
        const elements = document.querySelectorAll(sel);
        elements.forEach((el) => {
          if (el.tagName === 'META') {
            const content = el.getAttribute('content');
            if (content && content.startsWith('http')) images.add(content);
          } else if (el.tagName === 'IMG' || el.tagName === 'PICTURE') {
            const img = el.tagName === 'PICTURE' ? el.querySelector('img') : el;
            if (!img) return;
            const src = img.getAttribute('data-src') || img.getAttribute('src') || img.getAttribute('srcset')?.split(',')[0]?.trim()?.split(' ')[0];
            if (src && src.startsWith('http') && !src.includes('data:image') && !src.includes('sprite') && !src.includes('icon') && !src.includes('logo')) {
              images.add(src.replace(/\._[A-Z]{2}\d+_/, '').replace(/._SL\d+_/, '').replace(/._SX\d+_/, '').replace(/._SY\d+_/, ''));
            }
          } else {
            // Check inline style + computed style for background-image
            const inlineStyle = el.getAttribute('style') || '';
            const bgMatch = inlineStyle.match(/background-image\s*:\s*url\(["']?(https?:\/\/[^"')]+)["']?\)/i);
            if (bgMatch?.[1]) {
              images.add(bgMatch[1]);
            } else {
              try {
                const computed = window.getComputedStyle(el);
                const bgImage = computed.backgroundImage;
                if (bgImage && bgImage !== 'none') {
                  const m = bgImage.match(/url\(["']?(https?:\/\/[^"')]+)["']?\)/);
                  if (m?.[1]) images.add(m[1]);
                }
              } catch (_) {}
            }
            // Also check child images
            el.querySelectorAll('img').forEach((img) => {
              const src = img.getAttribute('data-src') || img.getAttribute('src');
              if (src && src.startsWith('http') && !src.includes('sprite') && !src.includes('icon')) {
                images.add(src);
              }
            });
          }
        });
      }
      // Also scan page HTML for Myntra-style image URLs (assets.myntassets.com)
      const fullHtml = document.documentElement.innerHTML;
      const myntraImgRe = /https?:\/\/assets\.myntassets\.com\/[^\s"')+]+\.(?:jpg|jpeg|png|webp)/gi;
      let mm;
      while ((mm = myntraImgRe.exec(fullHtml)) !== null) {
        const url = mm[0];
        if (!url.includes('icon') && !url.includes('logo') && !url.includes('sprite') && url.includes('/w_')) {
          // Upscale Myntra images to high res
          const hiRes = url.replace(/\/w_\d+,/, '/w_720,').replace(/\/h_\d+,/, '/h_900,').replace(/q_\d+/, 'q_90');
          images.add(hiRes);
        }
      }
      return Array.from(images).filter((u) => u.startsWith('http')).slice(0, 8);
    }
    function getDescriptionParts(selectorList) {
      const parts = [];
      for (const sel of selectorList) {
        document.querySelectorAll(sel).forEach((el) => {
          if (el.tagName === 'META') { const c = el.getAttribute('content'); if (c) parts.push(c); }
          else { const text = el.textContent?.trim(); if (text && text.length > 10) parts.push(text); }
        });
        if (parts.length > 0) break;
      }
      return parts.join('\n\n').slice(0, 3000);
    }
    return {
      title: getText(sels.title), priceText: getText(sels.price),
      images: getImages(sels.images), ratingText: getText(sels.rating),
      description: getDescriptionParts(sels.description)
    };
  }, selectors);
}

async function scrapeJsonLd(page) {
  return await page.evaluate(() => {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const script of scripts) {
      try {
        let data = JSON.parse(script.textContent);
        if (Array.isArray(data)) data = data[0];
        if (data['@graph']) {
          const product = data['@graph'].find(
            (item) => item['@type'] === 'Product' || item['@type']?.includes?.('Product')
          );
          if (product) data = product;
        }
        if (data['@type'] === 'Product' || data['@type']?.includes?.('Product')) {
          const images = [];
          if (data.image) {
            const imgArr = Array.isArray(data.image) ? data.image : [data.image];
            imgArr.forEach((img) => {
              if (typeof img === 'string') images.push(img);
              else if (img?.url) images.push(img.url);
              else if (img?.contentUrl) images.push(img.contentUrl);
            });
          }
          let priceText = '';
          const offers = data.offers;
          if (offers) {
            const offerObj = Array.isArray(offers) ? offers[0] : offers;
            priceText = String(
              offerObj?.price ?? offerObj?.lowPrice ?? offerObj?.highPrice ?? ''
            );
          }
          let ratingText = '';
          if (data.aggregateRating) {
            ratingText = String(data.aggregateRating.ratingValue ?? '');
          }
          return {
            title: data.name || '',
            priceText,
            images: images.slice(0, 6),
            ratingText,
            description: data.description || '',
          };
        }
      } catch (_) {}
    }
    return null;
  });
}

async function scrapeMetaFallback(page) {
  return await page.evaluate(() => {
    function getMeta(property) {
      const el = document.querySelector(
        `meta[property="${property}"], meta[name="${property}"]`
      );
      return el ? el.getAttribute('content')?.trim() : '';
    }
    const images = [];
    const ogImage = getMeta('og:image');
    if (ogImage) images.push(ogImage);
    const twitterImage = getMeta('twitter:image');
    if (twitterImage && twitterImage !== ogImage) images.push(twitterImage);

    const title =
      getMeta('og:title') ||
      getMeta('twitter:title') ||
      document.querySelector('h1')?.textContent?.trim() ||
      document.title?.split(/[-|–]/)[0]?.trim() ||
      '';

    let priceText =
      getMeta('product:price:amount') ||
      getMeta('og:price:amount') ||
      getMeta('twitter:data1') ||
      '';

    if (!priceText) {
      const priceEl = document.querySelector(
        '[itemprop="price"], [data-price], .price, [class*="price"]:not([class*="strikethrough"]):not([class*="old"])'
      );
      if (priceEl) {
        priceText =
          priceEl.getAttribute('content') || priceEl.textContent?.trim() || '';
      }
    }

    return {
      title,
      priceText,
      images,
      ratingText:
        getMeta('rating') ||
        document
          .querySelector('[itemprop="ratingValue"]')
          ?.getAttribute('content') ||
        '',
      description:
        getMeta('og:description') ||
        getMeta('description') ||
        getMeta('twitter:description') ||
        '',
    };
  });
}

async function resolveShortUrl(shortUrl) {
  const ua = USER_AGENTS[0];

  // Strategy 1: axios GET with redirect following + parse HTML for redirect URLs
  try {
    const resp = await axios.get(shortUrl, {
      maxRedirects: 10,
      timeout: 15000,
      headers: {
        'User-Agent': ua,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      validateStatus: () => true,
    });

    const finalUrl = resp.request?.res?.responseUrl || resp.request?._redirectable?._currentUrl || shortUrl;
    if (finalUrl !== shortUrl && !finalUrl.includes('dl.flipkart.com')) {
      console.log(`[scraper] Short URL resolved via HTTP redirect: ${finalUrl}`);
      return finalUrl;
    }

    const html = typeof resp.data === 'string' ? resp.data : '';

    // Check for meta refresh
    const metaRefresh = html.match(/http-equiv=["']?refresh["']?[^>]*url=["']?([^"'\s>]+)/i);
    if (metaRefresh?.[1]) {
      console.log(`[scraper] Short URL resolved via meta refresh: ${metaRefresh[1]}`);
      return metaRefresh[1];
    }

    // Check for JS redirect patterns
    const jsRedirects = [
      /window\.location(?:\.href)?\s*=\s*["']([^"']+)/i,
      /location\.replace\(["']([^"']+)/i,
      /location\.assign\(["']([^"']+)/i,
      /redirect[_\-]?url["']?\s*[:=]\s*["']([^"']+flipkart\.com[^"']*)/i,
      /canonical["']?\s*[:=]\s*["'](https?:\/\/[^"']+flipkart\.com[^"']*)/i,
      /href=["'](https?:\/\/(?:www\.)?flipkart\.com\/[^"']+)/i,
      /href=["'](https?:\/\/(?:www\.)?amazon\.[^"']+\/dp\/[^"']+)/i,
    ];
    for (const pattern of jsRedirects) {
      const m = html.match(pattern);
      if (m?.[1] && m[1].startsWith('http')) {
        console.log(`[scraper] Short URL resolved via HTML parse: ${m[1]}`);
        return m[1];
      }
    }
  } catch (e) {
    console.log(`[scraper] Short URL HTTP resolve failed: ${e.message}`);
  }

  // Strategy 2: try fetch HEAD as fallback
  try {
    const resp = await fetch(shortUrl, {
      method: 'GET',
      redirect: 'follow',
      headers: { 'User-Agent': ua },
    });
    if (resp.url && resp.url !== shortUrl) {
      console.log(`[scraper] Short URL resolved via fetch: ${resp.url}`);
      return resp.url;
    }
  } catch (_) {}

  console.log(`[scraper] Could not resolve short URL, using as-is: ${shortUrl}`);
  return shortUrl;
}

async function scrapeProduct(url) {
  let resolvedUrl = url;
  if (/dl\.flipkart\.com|amzn\.to|bit\.ly|tinyurl|shortened/.test(url)) {
    resolvedUrl = await resolveShortUrl(url);
  }

  const platform = detectPlatform(resolvedUrl);
  const ua = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  const isFlipkart = platform.key === 'flipkart';
  const isAmazon = platform.key === 'amazon';

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-blink-features=AutomationControlled',
        '--window-size=1920,1080',
        '--disable-features=IsolateOrigins,site-per-process',
        '--lang=en-US,en',
      ],
    });

    const page = await browser.newPage();

    await applyStealthMeasures(page);
    await page.setUserAgent(ua);
    await page.setViewport({ width: 1366 + Math.floor(Math.random() * 554), height: 768 + Math.floor(Math.random() * 312) });
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9,hi;q=0.8',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'sec-ch-ua': '"Chromium";v="131", "Not_A Brand";v="24"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'upgrade-insecure-requests': '1',
    });

    if (isFlipkart) {
      await page.setCookie(
        { name: 'T', value: 'TI' + Date.now(), domain: '.flipkart.com', path: '/' },
        { name: 'SN', value: String(Date.now()), domain: '.flipkart.com', path: '/' },
      );
    }

    const waitUntilOption = (isFlipkart || isAmazon) ? 'networkidle2' : 'domcontentloaded';
    await page.goto(resolvedUrl, { waitUntil: waitUntilOption, timeout: 60000 });

    // Handle reCAPTCHA if present
    const captchaResolved = await waitForCaptchaResolution(page, 12000);
    if (captchaResolved) {
      console.log('[scraper] Page ready');
    } else {
      console.log('[scraper] Captcha detected, reloading...');
      await page.reload({ waitUntil: 'networkidle2', timeout: 30000 });
      await waitForCaptchaResolution(page, 10000);
    }

    // If still on a share/short URL, wait for JS redirect
    let currentUrl = page.url();
    if (/dl\.flipkart\.com|amzn\.to|bit\.ly/.test(currentUrl)) {
      console.log('[scraper] Still on short URL, waiting for redirect...');
      try {
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
      } catch (_) {}
      currentUrl = page.url();

      if (/dl\.flipkart\.com/.test(currentUrl)) {
        const extractedUrl = await page.evaluate(() => {
          const links = document.querySelectorAll('a[href*="flipkart.com"]');
          for (const a of links) {
            const href = a.getAttribute('href');
            if (href && href.includes('www.flipkart.com') && href.includes('/p/')) return href;
          }
          const scripts = document.querySelectorAll('script');
          for (const s of scripts) {
            const text = s.textContent || '';
            const m = text.match(/(https?:\/\/(?:www\.)?flipkart\.com\/[^\s"']+\/p\/[^\s"']+)/);
            if (m) return m[1];
          }
          const canonical = document.querySelector('link[rel="canonical"]');
          if (canonical?.href && canonical.href.includes('flipkart.com')) return canonical.href;
          return null;
        }).catch(() => null);

        if (extractedUrl) {
          console.log(`[scraper] Extracted product URL from page: ${extractedUrl}`);
          await page.goto(extractedUrl, { waitUntil: 'networkidle2', timeout: 45000 });
          await waitForCaptchaResolution(page, 10000);
        }
      }
    }

    // Wait for page content to render
    if (isAmazon) {
      try {
        await page.waitForSelector('#productTitle', { timeout: 8000 });
      } catch (_) {
        console.log('[scraper] #productTitle not found, waiting extra...');
        await randomDelay(3000, 5000);
      }
    } else {
      await randomDelay(1500, 3000);
    }
    await simulateHumanBehavior(page);

    const pageUrl = page.url();
    const pageTitle = await page.title().catch(() => '');
    console.log(`[scraper] Page loaded: "${pageTitle}" — ${pageUrl}`);

    let data;

    // 1) Try JSON-LD structured data first (most reliable)
    try {
      const ldData = await scrapeJsonLd(page);
      if (ldData && (ldData.title || ldData.priceText)) {
        console.log(`[scraper] JSON-LD found: title="${ldData.title?.slice(0, 60)}", price="${ldData.priceText}"`);
        data = ldData;
      }
    } catch (ldErr) {
      const m = (ldErr?.message) || '';
      if (!/Execution context was destroyed|Target closed|Protocol error/.test(m)) {
        console.log('[scraper] JSON-LD parse error:', m);
      }
    }

    // 2) Try platform-specific / generic selectors (always, to supplement images)
    const needsPlatformScrape = !data || !data.title || !data.priceText || (data.images || []).length < 3;
    if (needsPlatformScrape) {
      try {
        let platformData;
        if (isFlipkart) {
          platformData = await scrapeFlipkart(page);
        } else if (isAmazon) {
          platformData = await scrapeAmazon(page);
        } else {
          platformData = await scrapeWithSelectors(page, platform.selectors);
        }

        if (platformData) {
          if (!data) {
            data = platformData;
          } else {
            // Merge: keep best title/price from JSON-LD, supplement images/description
            if (!data.title && platformData.title) data.title = platformData.title;
            if (!data.priceText && platformData.priceText) data.priceText = platformData.priceText;
            if (!data.description && platformData.description) data.description = platformData.description;
            if (!data.ratingText && platformData.ratingText) data.ratingText = platformData.ratingText;
            // Merge images — add platform images that aren't already in JSON-LD set
            const existingUrls = new Set((data.images || []).map((u) => u.split('?')[0]));
            (platformData.images || []).forEach((img) => {
              if (!existingUrls.has(img.split('?')[0])) {
                data.images = data.images || [];
                data.images.push(img);
              }
            });
          }
          console.log(`[scraper] Platform scraper: title="${(platformData.title || '').slice(0, 50)}", images=${(platformData.images||[]).length}, merged total=${(data.images||[]).length}`);
        }
      } catch (scrapeErr) {
        const msg = (scrapeErr && scrapeErr.message) || String(scrapeErr);
        if (/Execution context was destroyed|Target closed|Protocol error|Navigating/.test(msg)) {
          data = data || {};
        } else throw scrapeErr;
      }
    }

    // 3) Meta tag fallback
    if (!data || (!data.title && !data.priceText)) {
      console.log('[scraper] Primary selectors failed, trying meta tag fallback...');
      try {
        const metaData = await scrapeMetaFallback(page);
        if (metaData && (metaData.title || metaData.priceText)) {
          console.log(`[scraper] Meta fallback found: title="${(metaData.title || '').slice(0, 60)}", price="${metaData.priceText}"`);
          data = metaData;
        }
      } catch (metaErr) {
        const m = (metaErr && metaErr.message) || '';
        if (!/Execution context was destroyed|Target closed|Protocol error|Navigating/.test(m)) {
          console.log('[scraper] Meta fallback error:', m);
        }
      }
    }

    // Merge: if we have title from one source but images/description from another, combine
    if (!data) data = {};

    let videos = [];
    try {
      videos = await page.evaluate(() => {
        const videoUrls = new Set();

        document.querySelectorAll('video source, video').forEach((el) => {
          const src = el.getAttribute('src') || el.getAttribute('data-src');
          if (src && src.startsWith('http') && (src.includes('.mp4') || src.includes('.webm'))) {
            videoUrls.add(src);
          }
        });

        const ogVideo = document.querySelector('meta[property="og:video"], meta[property="og:video:url"]');
        if (ogVideo) {
          const content = ogVideo.getAttribute('content');
          if (content && content.startsWith('http')) videoUrls.add(content);
        }

        document.querySelectorAll('script').forEach((script) => {
          const text = script.textContent || '';
          const mp4Matches = text.match(/https?:\/\/[^"'\s]+\.mp4(?:\?[^"'\s]*)?/g);
          if (mp4Matches) {
            mp4Matches.forEach((u) => {
              if (!u.includes('tracking') && !u.includes('analytics') && !u.includes('pixel'))
                videoUrls.add(u);
            });
          }
        });

        document.querySelectorAll('[data-video-url], [data-video], [data-src*=".mp4"]').forEach((el) => {
          const videoUrl = el.getAttribute('data-video-url') || el.getAttribute('data-video') || el.getAttribute('data-src');
          if (videoUrl && videoUrl.startsWith('http') && (videoUrl.includes('.mp4') || videoUrl.includes('.webm'))) {
            videoUrls.add(videoUrl);
          }
        });

        // Also check for video URLs in full page HTML (Myntra, etc.)
        const fullHtml = document.documentElement.innerHTML;
        const videoRe = /https?:\/\/[^"'\s>]+\.mp4(?:\?[^"'\s>]*)?/gi;
        let vMatch;
        while ((vMatch = videoRe.exec(fullHtml)) !== null) {
          const u = vMatch[0];
          if (!u.includes('tracking') && !u.includes('analytics') && !u.includes('pixel') && !u.includes('favicon')) {
            videoUrls.add(u);
          }
        }

        return Array.from(videoUrls).slice(0, 3);
      });
    } catch (videoErr) {
      if (!/Execution context was destroyed|Target closed|Protocol error/.test(videoErr?.message || '')) {
        console.warn('Video scrape failed:', videoErr?.message);
      }
    }

    let finalUrl = resolvedUrl;
    try { finalUrl = page.url() || resolvedUrl; } catch (_) {}

    const title = (data.title || '').trim();
    const originalPrice = parsePrice(data.priceText);

    if (!title && !data.priceText && (!data.images || data.images.length === 0)) {
      console.log(`[scraper] Nothing extracted. Page title: "${pageTitle}", URL: ${pageUrl}`);
      throw new Error('Could not extract product details. The page may have redirected or is not supported.');
    }

    const finalTitle = title || pageTitle?.split(/[-|–]/)[0]?.trim() || 'Imported Product';

    console.log(`[scraper] Final result: title="${finalTitle.slice(0, 60)}", price=${originalPrice}, images=${(data.images || []).length}, videos=${videos.length}`);

    return {
      title: finalTitle,
      originalPrice: Number.isFinite(originalPrice) && originalPrice > 0 ? originalPrice : 999,
      images: data.images || [],
      videos: videos || [],
      rating: parseRating(data.ratingText),
      description: data.description || '',
      sourcePlatform: platform.name,
      sourceLink: finalUrl || resolvedUrl
    };
  } catch (error) {
    const msg = (error && error.message) || '';
    if (/Execution context was destroyed|Target closed/.test(msg)) {
      throw new Error('Could not extract product details. The page may have redirected or is not supported.');
    }
    if (msg.startsWith('Scraping failed:') || msg.startsWith('Could not extract')) throw error;
    throw new Error(`Scraping failed: ${msg}`);
  } finally {
    if (browser) await browser.close();
  }
}

module.exports = { scrapeProduct, detectPlatform };
