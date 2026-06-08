# 🛡 Review Guardian

<div align="center">

**AI-Powered Fake Review Detection Platform**

*Built in 24 hours · Hackathon Winner 🏆*

[![Made With](https://img.shields.io/badge/Made%20With-MERN%20Stack-green?style=for-the-badge&logo=react)](https://reactjs.org/)
[![ML Accuracy](https://img.shields.io/badge/ML%20Accuracy-71.8%25-brightgreen?style=for-the-badge&logo=python)](.)
[![Training Data](https://img.shields.io/badge/Training%20Data-42%2C032%20Reviews-blue?style=for-the-badge&logo=databricks)](.)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension%20MV3-yellow?style=for-the-badge&logo=googlechrome)](.)

</div>

---

## 🏆 Hackathon Achievement

> This project was built entirely within a **24-hour hackathon** and **won in our domain category**.
>
> The challenge: build a product that solves a real consumer problem using AI.
> Our solution: a full-stack platform that detects fake, AI-generated, and bot-written product reviews — with a trained ML model, explainable results, and a Chrome extension that works live on any e-commerce site.

---

## 📁 Repository Structure

```
AI_REVIEW_DETECTOR/
├── review-guardian-website/       ← Full-stack MERN web platform
│   ├── client/                    ← React + Vite frontend
│   └── server/                    ← Node.js + Express + MongoDB backend
└── review-guardian-extension/     ← Chrome Extension (Manifest V3)
```

---

## 🌐 Web Platform

A complete dashboard where users paste product reviews or upload a CSV and receive an explainable **Trust Grade (A–F)** powered by a trained ML model and Groq LLaMA 3.3 70B.

**Key features:**
- Paste reviews or upload CSV — instant analysis
- 4-dimension NLP scoring with signal-level breakdowns
- History dashboard backed by MongoDB — click any past analysis for the full report
- Explainable AI — quotes exact phrases, shows why a review is flagged
- Sentiment analysis, fake activity trend chart, suspicious review panel

**Tech Stack:**

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router, Recharts, Lucide |
| Backend | Node.js, Express |
| Database | MongoDB, Mongoose |
| AI / LLM | Groq API — LLaMA 3.3 70B (free tier) |
| ML Model | Logistic Regression (trained on 42K reviews) |
| Security | Helmet, CORS, Rate Limiting |

---

## 🔌 Chrome Extension

A lightweight browser extension that scrapes and analyzes reviews **directly on product pages** — no copy-pasting required. The full NLP scoring engine runs entirely in-browser for privacy.

**Supported sites:** Amazon · Flipkart · Myntra · Meesho · Nykaa · eBay · Walmart · Snapdeal · Ajio · Best Buy · Target · Etsy · AliExpress · Tata Cliq · Reliance Digital · and more via universal fallback

**Key features:**
- One-click analysis on any product page
- Same 4-dimension scoring as the web platform
- Full dashboard opens in a new tab with flagged reviews, AI phrases, fake activity trend
- Privacy-first — all scoring happens locally in your browser

---

## 🧠 ML Model

The core of Review Guardian is a **Logistic Regression classifier** trained from scratch on labeled review data — not a prompt-engineered LLM.

### Performance

| Metric | Score |
|--------|-------|
| **Accuracy** | **71.8%** |
| Precision | 72.3% |
| Recall | 70.2% |
| F1 Score | 71.2% |
| Training Set | 33,625 reviews |
| Test Set | 8,407 reviews |

### Training Datasets

| Dataset | Size | Source |
|---------|------|--------|
| Fake Reviews Dataset (CG vs OR) | 40,432 reviews | Amazon product reviews |
| Deceptive Opinion Spam | 1,600 reviews | Hotel reviews |
| Women's Clothing Reviews | 22,592 reviews | Real human (calibration) |
| Amazon Alexa Reviews | 2,575 reviews | Verified reviews (calibration) |
| Indian E-Commerce SA Dataset | 12,775 reviews | Indian platform reviews (calibration) |

### Key Calibration Findings from Data

- **50.2%** of genuine reviews have zero complaint signals — model accounts for this
- **Only 3%** of real reviews contain any confirmed AI signature phrase
- **99.6%** of real reviews cover ≤4 product feature categories — 5+ is suspicious
- Fake reviews have **9% lower TTR** (vocabulary diversity) than real reviews
- Real reviews have **2.5x more specific measurements** (numbers, units) than fake reviews

### 4 Scoring Dimensions

| Dimension | Weight | What It Measures |
|-----------|--------|-----------------|
| Linguistic Authenticity | 35% | TTR, AI phrase detection, informal language, contraction use |
| Sentiment Consistency | 20% | Complaint presence, exclamation patterns, superlative density |
| Posting Behavior | 25% | Purchase context, specific measurements, feature category coverage |
| Review Repetition | 20% | Sentence variance, vocabulary diversity, filler phrase patterns |

---

## 🚀 Quick Start

### Website

```bash
# 1. Install dependencies
cd review-guardian-website/server && npm install
cd ../client && npm install

# 2. Configure environment
cd ../server
cp .env.example .env
# Set GROQ_API_KEY (free at console.groq.com) and MONGODB_URI

# 3. Run backend (Terminal 1)
npm run dev

# 4. Run frontend (Terminal 2)
cd ../client && npm run dev
```

Open **http://localhost:5173**

### Chrome Extension

```
1. Open Chrome → chrome://extensions/
2. Enable Developer Mode (top right)
3. Click "Load unpacked"
4. Select the review-guardian-extension/ folder
5. Click the shield icon on any product page
```

---

## 🏗 Architecture

```
User pastes reviews
        ↓
React Frontend (Vite)
        ↓
Express API /api/analysis
        ↓
┌─────────────────────────────────┐
│   NLP Feature Extraction        │
│   • TTR (vocab diversity)       │
│   • Filler phrase detection     │
│   • Sentence length variance    │
│   • Feature category coverage   │
│   • Complaint signal counting   │
│   • Contraction / exclamation   │
└──────────────┬──────────────────┘
               ↓
┌─────────────────────────────────┐
│   Logistic Regression Model     │
│   Trained on 42,032 reviews     │
│   → Fake probability score      │
│   → Trust Grade A–F             │
└──────────────┬──────────────────┘
               ↓
┌─────────────────────────────────┐
│   Groq LLaMA 3.3 70B           │
│   → Natural language verdict    │
│   → Quoted phrase explanation   │
│   (Scores locked — LLM only    │
│    explains, never overrides)   │
└──────────────┬──────────────────┘
               ↓
         MongoDB save
               ↓
      Response to frontend
```

---

## 👥 Team

Built in 24 hours at a college hackathon. Won in our domain. 🏆

---

## 📄 License

MIT © 2026 Review Guardian
