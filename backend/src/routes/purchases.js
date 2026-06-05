const express = require('express');
const { body } = require('express-validator');
const purchaseController = require('../controllers/purchaseController');
const { auth, requireDeptAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validator');

const router = express.Router();

router.get('/', auth, purchaseController.getPurchases);
router.post('/', auth, [
    body('name').notEmpty().withMessage('资产名称不能为空'),
    body('quantity').isInt({ min: 1 }).withMessage('数量必须大于0')
], validate, purchaseController.createPurchase);
router.post('/batch-audit', auth, purchaseController.batchAudit);
router.get('/:id', auth, purchaseController.getPurchaseById);
router.put('/:id/dept-audit', auth, requireDeptAdmin, purchaseController.deptAudit);
router.put('/:id/super-audit', auth, purchaseController.superAudit);
router.put('/:id/withdraw', auth, purchaseController.withdrawPurchase);

module.exports = router;
