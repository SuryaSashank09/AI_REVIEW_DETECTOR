# 🛡 Review Guardian — Chrome Extension

> Detect fake and AI-generated product reviews directly on any e-commerce page. Works on Amazon, Flipkart, Myntra, eBay, Walmart, Meesho, Nykaa, AliExpress, Etsy and more.

![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue?style=flat-square)
![Platforms](https://img.shields.io/badge/Platforms-15%2B_Sites-green?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)

---

## How It Works

1. Navigate to any product page with reviews
2. Click the **Review Guardian** icon in your browser toolbar
3. Click **Analyze Reviews** — the extension scrapes reviews from the page automatically
4. See an instant Trust Grade (A–F) with signal breakdowns
5. Click **View Full Dashboard** for detailed analysis

No API key needed. No data leaves your browser except to the scoring engine.

---

## Features

- **Works on 15+ sites** — Amazon, Flipkart, Myntra, eBay, Walmart, Meesho, Nykaa, Snapdeal, Ajio, Best Buy, Target, Etsy, AliExpress, Tata Cliq, Reliance Digital
- **Universal fallback** — Schema.org structured data + CSS class pattern matching for any other site
- **NLP scoring engine** — Same 4-dimension model as the web platform (ported to run entirely in-browser)
- **4 Signal Dimensions** — Linguistic Authenticity (35%), Sentiment Consistency (20%), Posting Behavior (25%), Review Repetition (20%)
- **Full dashboard** — Opens a detailed report in a new tab with flagged reviews, AI phrases, fake activity trend
- **Privacy first** — All NLP scoring runs locally in your browser. No review text is sent to any server.

---

## Files

```
review-guardian-extension/
├── manifest.json      ← Chrome Extension Manifest V3
├── popup.html         ← Extension popup UI
├── popup.js           ← NLP scoring engine + scraper (runs in popup)
├── content.js         ← Passive listener (ping handler)
├── styles.css         ← Popup styles
└── dashboard.html     ← Full analysis dashboard (opens in new tab)
```

---

## Installation (Developer Mode)

1. Download or clone this folder
2. Open Chrome → `chrome://extensions/`
3. Enable **Developer Mode** (top right toggle)
4. Click **Load unpacked**
5. Select the `review-guardian-extension` folder
6. The shield icon appears in your toolbar ✅

---

## Supported Sites

| Site | Scraper |
|------|---------|
| Amazon (.in, .com, .co.uk) | Custom DOM parser |
| Flipkart | Custom DOM parser |
| Myntra | Custom DOM parser |
| Meesho | Custom DOM parser |
| Nykaa | CSS class matching |
| Snapdeal | CSS class matching |
| eBay | CSS class matching |
| Walmart | CSS class matching |
| Best Buy | CSS class matching |
| Target | CSS class matching |
| Etsy | CSS class matching |
| AliExpress | CSS class matching |
| Any other site | Schema.org + data-testid fallback |

---

## NLP Scoring Engine

The extension runs the full NLP pipeline locally — no external API call for scoring:

- **Lexicon matching** — 60+ confirmed AI signature phrases validated against 42K labeled reviews
- **TTR (Type-Token Ratio)** — Vocabulary diversity (fake avg: 0.723, real avg: 0.801)
- **Sentence variance** — Uniform length = AI signal
- **Feature coverage** — 99.6% of real reviews cover ≤4 product categories; 5+ = suspicious
- **Flesch-Kincaid** — Readability score
- **Complaint signals** — 50.2% of real reviews have zero complaints (calibrated)

---

## Related

[Review Guardian Web Platform](../review-guardian-website) — Full MERN stack dashboard with MongoDB history, CSV upload, and Groq LLM explanations.

---
