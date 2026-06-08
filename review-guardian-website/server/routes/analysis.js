const express  = require('express');
const router   = express.Router();
const { analyze } = require('../controllers/analysisController');

router.post('/', analyze);

module.exports = router;
