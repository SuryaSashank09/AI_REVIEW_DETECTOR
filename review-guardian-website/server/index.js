const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const morgan    = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoose  = require('mongoose');

const analysisRoutes = require('./routes/analysis');
const historyRoutes  = require('./routes/history');
const scrapeRoutes   = require('./routes/scrape');

const app  = express();
const PORT = process.env.PORT || 5000;

console.log('🔑 GROQ KEY:', process.env.GROQ_API_KEY ? 'LOADED ✅' : 'MISSING ❌');

app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan('dev'));
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', methods: ['GET','POST','DELETE'], allowedHeaders: ['Content-Type'] }));
app.use(express.json({ limit: '2mb' }));
app.use('/api/', rateLimit({ windowMs: 15*60*1000, max: 100 }));

app.use('/api/analysis', analysisRoutes);
app.use('/api/history',  historyRoutes);
app.use('/api/scrape',   scrapeRoutes);

app.get('/api/health', (req, res) => res.json({
  status: 'ok',
  groq: process.env.GROQ_API_KEY ? 'loaded' : 'MISSING',
  db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
}));

app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, req, res, next) => { console.error(err.stack); res.status(err.status||500).json({ error: err.message||'Internal server error' }); });

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.warn('⚠️  MongoDB skipped:', err.message));

app.listen(PORT, () => console.log(`🚀 Server → http://localhost:${PORT}`));
