const express = require('express');
const { body } = require('express-validator');
const repairController = require('../controllers/repairController');
const { auth, requireDeptAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validator');

const router = express.Router();

router.get('/', auth, repairController.getRepairs);

router.post('/', auth, [
    body('asset_id').isInt().withMessage('请选择资产'),
    body('fault_description').notEmpty().withMessage('故障描述不能为空')
], validate, repairController.createRepair);

router.post('/batch-audit', auth, requireDeptAdmin, repairController.batchAuditRepair);

router.put('/:id/audit', auth, requireDeptAdmin, repairController.auditRepair);
router.put('/:id/start-repair', auth, requireDeptAdmin, repairController.startRepair);
router.put('/:id/complete-repair', auth, requireDeptAdmin, repairController.completeRepair);
router.put('/:id/acceptance', auth, requireDeptAdmin, repairController.acceptanceRepair);
router.put('/:id/withdraw', auth, repairController.withdrawRepair);

module.exports = router;
