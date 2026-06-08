# 🛡 Review Guardian — Web Platform

> AI-powered fake review detection platform. Paste product reviews and get an instant Trust Grade (A–F) backed by a logistic regression model trained on **42,032 labeled reviews**.

![Tech Stack](https://img.shields.io/badge/Stack-MERN-green?style=flat-square)
![Model Accuracy](https://img.shields.io/badge/ML_Accuracy-71.8%25-brightgreen?style=flat-square)
![Training Data](https://img.shields.io/badge/Training_Data-42K_reviews-blue?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)

---

## Features

- **Trained ML Model** — Logistic regression trained on 42,032 labeled fake vs real Amazon reviews
- **4-Dimension NLP Analysis** — Linguistic Authenticity, Sentiment Consistency, Posting Behavior, Review Repetition
- **Explainable AI** — Quotes exact phrases, shows why each review is flagged
- **CSV Upload** — Analyze bulk reviews from a spreadsheet
- **History Dashboard** — All analyses saved in MongoDB with full report on click
- **Free to Use** — Powered by Groq LLaMA 3.3 70B (free tier)

---

## Model Performance

| Metric    | Score  |
|-----------|--------|
| Accuracy  | 71.8%  |
| Precision | 72.3%  |
| Recall    | 70.2%  |
| F1 Score  | 71.2%  |
| Train Set | 33,625 reviews |
| Test Set  | 8,407 reviews  |

Datasets: Fake Reviews Dataset (40K), Deceptive Opinion Spam (1.6K), Women's Clothing Reviews (22K), Amazon Alexa Reviews (2.5K), Indian E-Commerce SA Dataset (12.7K)

---

## Architecture

```
review-guardian-website/
├── server/
│   ├── index.js                    ← Express entry point
│   ├── controllers/
│   │   └── analysisController.js  ← ML model + Groq LLM explainer
│   ├── models/
│   │   └── Analysis.js            ← Mongoose schema
│   └── routes/
│       ├── analysis.js
│       ├── history.js
│       └── scrape.js
└── client/
    └── src/
        ├── pages/                 ← Dashboard, Analyze, History, TrueRating, Suspicious
        ├── components/layout/     ← Sidebar, Header, Layout
        ├── components/ui/         ← Card, GradeBadge, ScoreBar, LoadingOverlay
        └── context/               ← Global analysis state
```

---

## Quick Start

```bash
# Install
cd server && npm install
cd ../client && npm install

# Configure
cd server && cp .env.example .env
# Add GROQ_API_KEY (free at console.groq.com) and MONGODB_URI

# Run backend
cd server && npm run dev

# Run frontend (new terminal)
cd client && npm run dev
```

Open **http://localhost:5173**

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/analysis` | Analyze review text (ML + LLM) |
| GET | `/api/history` | Get last 20 analyses |
| GET | `/api/history/:id` | Get single analysis |
| DELETE | `/api/history/:id` | Delete analysis |
| POST | `/api/scrape` | Scrape reviews from product URL |
| GET | `/api/health` | Health check |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router, Recharts |
| Backend | Node.js, Express |
| Database | MongoDB, Mongoose |
| AI/LLM | Groq API — LLaMA 3.3 70B |
| ML | Logistic Regression (trained, 42K reviews) |
| Security | Helmet, CORS, Rate Limiting |

---

## Related

[Review Guardian Chrome Extension](../review-guardian-extension) — Analyze reviews directly on any product page.

---
