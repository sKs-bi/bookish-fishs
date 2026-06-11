const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const auth = require('../middleware/auth');

router.post('/chat', auth, aiController.chat);
router.post('/assets', auth, aiController.getAssetData);

module.exports = router;
