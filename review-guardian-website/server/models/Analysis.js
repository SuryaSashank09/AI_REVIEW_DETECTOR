const mongoose = require('mongoose');

const AnalysisSchema = new mongoose.Schema({
  productUrl:    { type: String, default: null },
  reviewCount:   { type: Number, default: 0 },
  reviewSnippet: { type: String, maxlength: 300 },
  score:         { type: Number, required: true },
  grade:         { type: String, enum: ['A','B','C','D','F'] },
  gradeTitle:    String,
  gradeSubtitle: String,
  signals:       [{ name: String, score: Number, weight: Number, description: String }],
  findings:      [{ type: { type: String, enum: ['good','warn','bad'] }, text: String }],
  verdict:       String,
  sentimentBreakdown: {
    positive: { type: Number, default: 0 },
    neutral:  { type: Number, default: 0 },
    negative: { type: Number, default: 0 },
  },
  fakeActivityData: [{ label: String, value: Number }],
}, { timestamps: true });

module.exports = mongoose.model('Analysis', AnalysisSchema);
