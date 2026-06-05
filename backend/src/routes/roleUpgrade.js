const express = require('express');
const { body } = require('express-validator');
const roleUpgradeController = require('../controllers/roleUpgradeController');
const { auth, requireSuperAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validator');

const router = express.Router();

router.get('/targets', auth, roleUpgradeController.getUpgradeTargets);
router.get('/my', auth, roleUpgradeController.getMyRequests);
router.get('/all', auth, roleUpgradeController.getAllRequests);

router.post('/', auth, [
    body('target_role').isIn(['dept_admin', 'super_admin']).withMessage('无效的升级目标')
], validate, roleUpgradeController.createRequest);

router.delete('/:id', auth, roleUpgradeController.cancelRequest);
router.put('/:id/approve', auth, requireSuperAdmin, roleUpgradeController.approveRequest);
router.put('/:id/reject', auth, requireSuperAdmin, roleUpgradeController.rejectRequest);

module.exports = router;
