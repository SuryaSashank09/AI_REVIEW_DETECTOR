const express  = require('express');
const router   = express.Router();
const Analysis = require('../models/Analysis');

router.get('/', async (req, res, next) => {
  try {
    const items = await Analysis.find()
      .sort({ createdAt: -1 }).limit(20)
      .select('productUrl reviewCount score grade gradeTitle createdAt reviewSnippet');
    res.json(items);
  } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const item = await Analysis.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  } catch (e) { next(e); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await Analysis.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) { next(e); }
});

module.exports = router;
