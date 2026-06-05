const express = require('express');
const rejectionController = require('../controllers/rejectionController');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.get('/unread', auth, rejectionController.getUnreadRejections);
router.put('/read-all', auth, rejectionController.markAllRejectionsRead);
router.put('/:id/read', auth, rejectionController.markRejectionRead);

module.exports = router;
