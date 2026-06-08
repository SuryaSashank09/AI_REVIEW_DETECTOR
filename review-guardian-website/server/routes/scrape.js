const express = require('express');
const router  = express.Router();
const https   = require('https');
const http    = require('http');
const { URL } = require('url');

// Rotate user agents to avoid basic bot detection
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
];

function fetchPage(url, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    if (redirectCount > 5) return reject(new Error('Too many redirects'));
    let parsedUrl;
    try { parsedUrl = new URL(url); } catch { return reject(new Error('Invalid URL')); }

    const mod = parsedUrl.protocol === 'https:' ? https : http;
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      timeout: 15000,
      headers: {
        'User-Agent': USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-IN,en-US;q=0.9,en;q=0.8',
        'Accept-Encoding': 'identity',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'max-age=0',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'none',
      },
    };

    const req = mod.request(options, (res) => {
      if ([301,302,303,307,308].includes(res.statusCode) && res.headers.location) {
        const redirect = res.headers.location.startsWith('http')
          ? res.headers.location
          : `${parsedUrl.protocol}//${parsedUrl.hostname}${res.headers.location}`;
        return fetchPage(redirect, redirectCount + 1).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => {
        data += chunk;
        if (data.length > 800000) req.destroy(); // cap at 800KB
      });
      res.on('end', () => resolve({ html: data, status: res.statusCode }));
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    req.end();
  });
}

// ── AMAZON extractor ──
function extractAmazon(html) {
  const reviews = [];
  let rating = null;
  let productName = null;
  let reviewCount = null;

  // Product name
  const nameMatch = html.match(/id="productTitle"[^>]*>\s*([\s\S]{5,200}?)\s*<\/span>/);
  if (nameMatch) productName = nameMatch[1].replace(/\s+/g, ' ').trim();

  // Rating
  const ratingMatches = [
    html.match(/(\d\.\d)\s*out of\s*5\s*stars/),
    html.match(/"ratingScore"\s*:\s*"(\d\.\d)"/),
    html.match(/averageStarRating[^>]*>\s*(\d\.\d)/),
  ];
  for (const m of ratingMatches) { if (m) { rating = parseFloat(m[1]); break; } }

  // Review count
  const countMatch = html.match(/([\d,]+)\s*(?:global\s*)?(?:customer\s*)?ratings/i);
  if (countMatch) reviewCount = parseInt(countMatch[1].replace(/,/g, ''));

  // Review text — multiple patterns
  const patterns = [
    /data-hook="review-body"[\s\S]*?<span[^>]*>([\s\S]{30,1200}?)<\/span>\s*<\/span>/g,
    /class="review-text-content"[^>]*>\s*<span[^>]*>([\s\S]{30,1200}?)<\/span>/g,
    /"reviewText"\s*:\s*\{[^}]*"displayValue"\s*:\s*"([^"]{30,1200})"/g,
    /class="[^"]*review-text[^"]*"[^>]*>([\s\S]{30,800}?)<\/div>/g,
  ];

  for (const pattern of patterns) {
    let m;
    while ((m = pattern.exec(html)) !== null && reviews.length < 20) {
      const text = m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').replace(/\\n/g, ' ').trim();
      if (text.length > 30 && !reviews.some(r => r.slice(0,50) === text.slice(0,50))) {
        reviews.push(text);
      }
    }
    if (reviews.length >= 5) break;
  }

  return { reviews, rating, productName, reviewCount };
}

// ── FLIPKART extractor ──
function extractFlipkart(html) {
  const reviews = [];
  let rating = null;
  let productName = null;

  const ratingPatterns = [
    html.match(/"averageRating"\s*:\s*"?(\d+\.?\d*)"?/),
    html.match(/class="[^"]*_3LWZlK[^"]*"[^>]*>(\d\.\d)/),
    html.match(/(\d\.\d)\s*<\/div>\s*<div[^>]*class="[^"]*_3k9CP0/),
  ];
  for (const m of ratingPatterns) { if (m) { rating = parseFloat(m[1]); break; } }

  const namePatterns = [
    html.match(/"title"\s*:\s*"([^"]{10,200})"/),
    html.match(/class="[^"]*B_NuCI[^"]*"[^>]*>([\s\S]{5,200}?)<\/span>/),
  ];
  for (const m of namePatterns) { if (m) { productName = m[1].trim(); break; } }

  const reviewPatterns = [
    /class="[^"]*t-ZTKy[^"]*"[^>]*>([\s\S]{20,800}?)<\/div>/g,
    /class="[^"]*qwjRop[^"]*"[^>]*>([\s\S]{20,800}?)<\/div>/g,
    /"reviewText"\s*:\s*"([^"]{20,800})"/g,
    /class="[^"]*_6K-7Co[^"]*"[^>]*>([\s\S]{20,600}?)<\/p>/g,
  ];
  for (const pattern of reviewPatterns) {
    let m;
    while ((m = pattern.exec(html)) !== null && reviews.length < 20) {
      const text = m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      if (text.length > 20) reviews.push(text);
    }
    if (reviews.length >= 3) break;
  }

  return { reviews, rating, productName, reviewCount: null };
}

// ── MYNTRA extractor ──
function extractMyntra(html) {
  const reviews = [];
  let rating = null;
  let productName = null;

  const ratingPatterns = [
    html.match(/"averageRating"\s*:\s*"?(\d+\.?\d*)"?/),
    html.match(/"ratings"\s*:\s*\{[^}]*"average"\s*:\s*(\d+\.?\d*)/),
    html.match(/class="[^"]*index-overallRating[^"]*"[^>]*>(\d\.\d)/),
  ];
  for (const m of ratingPatterns) { if (m) { rating = parseFloat(m[1]); break; } }

  const namePatterns = [
    html.match(/"productName"\s*:\s*"([^"]{5,200})"/),
    html.match(/"name"\s*:\s*"([^"]{10,150})"/),
  ];
  for (const m of namePatterns) { if (m) { productName = m[1]; break; } }

  const reviewPatterns = [
    /"reviewText"\s*:\s*"([^"]{20,800})"/g,
    /class="[^"]*user-review-[^"]*"[^>]*>([\s\S]{20,600}?)<\/div>/g,
    /class="[^"]*index-reviewText[^"]*"[^>]*>([\s\S]{20,600}?)<\/p>/g,
  ];
  for (const pattern of reviewPatterns) {
    let m;
    while ((m = pattern.exec(html)) !== null && reviews.length < 20) {
      const text = m[1].replace(/<[^>]+>/g, ' ').replace(/\\n/g,' ').replace(/\s+/g, ' ').trim();
      if (text.length > 20) reviews.push(text);
    }
    if (reviews.length >= 3) break;
  }

  return { reviews, rating, productName, reviewCount: null };
}

// ── JSON/LD structured data extractor (works on many sites) ──
function extractStructuredData(html) {
  const reviews = [];
  let rating = null;

  // JSON-LD
  const jsonLdMatches = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g) || [];
  for (const block of jsonLdMatches) {
    try {
      const json = JSON.parse(block.replace(/<script[^>]*>|<\/script>/g, '').trim());
      const items = Array.isArray(json) ? json : [json];
      for (const item of items) {
        if (item.aggregateRating?.ratingValue) rating = parseFloat(item.aggregateRating.ratingValue);
        const reviewList = item.review || item.reviews || [];
        for (const r of (Array.isArray(reviewList) ? reviewList : [reviewList])) {
          const text = r.reviewBody || r.description || '';
          if (text.length > 20) reviews.push(text);
        }
      }
    } catch {}
  }

  // Inline JSON data blobs
  const jsonBlobs = html.match(/"reviewText"\s*:\s*"([^"]{20,800})"/g) || [];
  jsonBlobs.forEach(b => {
    const m = b.match(/"reviewText"\s*:\s*"([^"]{20,800})"/);
    if (m) reviews.push(m[1].replace(/\\n/g,' ').replace(/\\"/g,'"'));
  });

  return { reviews, rating };
}

router.post('/', async (req, res) => {
  const { url } = req.body;
  if (!url || !url.startsWith('http')) {
    return res.status(400).json({ error: 'Invalid URL. Please provide a full product URL starting with http.' });
  }

  try {
    const { html, status } = await fetchPage(url);

    // Check if blocked
    if (status === 403 || status === 503 || html.includes('robot') || html.includes('CAPTCHA') || html.includes('captcha')) {
      return res.status(422).json({
        error: 'This site is blocking automated access (bot protection). Please copy the reviews manually from the product page.',
        blocked: true,
      });
    }

    const urlLower = url.toLowerCase();
    let extracted = { reviews: [], rating: null, productName: null, reviewCount: null };

    if (urlLower.includes('amazon'))        extracted = extractAmazon(html);
    else if (urlLower.includes('flipkart')) extracted = extractFlipkart(html);
    else if (urlLower.includes('myntra'))   extracted = extractMyntra(html);

    // Always try structured data as supplement
    const structured = extractStructuredData(html);
    if (structured.reviews.length > 0) extracted.reviews.push(...structured.reviews);
    if (!extracted.rating && structured.rating) extracted.rating = structured.rating;

    // Deduplicate and clean reviews
    const seen = new Set();
    const cleanReviews = extracted.reviews
      .map(r => r.replace(/\s+/g,' ').trim())
      .filter(r => {
        if (r.length < 20 || seen.has(r.slice(0,60))) return false;
        seen.add(r.slice(0,60));
        return true;
      })
      .slice(0, 20);

    if (cleanReviews.length === 0) {
      return res.status(422).json({
        error: 'Could not extract reviews from this page. This site likely requires JavaScript rendering. Please copy the review text manually from the product page and paste it in Analyze Product.',
        productName: extracted.productName,
        rating: extracted.rating,
        suggestion: 'manual',
      });
    }

    res.json({
      reviews:     cleanReviews,
      rating:      extracted.rating,
      reviewCount: extracted.reviewCount,
      productName: extracted.productName,
      reviewText:  cleanReviews.join('\n\n'),
      scraped:     true,
    });

  } catch (err) {
    console.error('Scrape error:', err.message);
    res.status(500).json({
      error: 'Failed to fetch this page. Please copy the reviews manually from the product page.',
      suggestion: 'manual',
    });
  }
});

module.exports = router;
