const express = require('express');
const { body } = require('express-validator');
const assetController = require('../controllers/assetController');
const { auth, requireDeptAdmin, requireSuperAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validator');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/', auth, assetController.getAssets);
router.get('/types', auth, assetController.getAssetTypes);
router.get('/locations', auth, assetController.getLocations);
router.get('/loans/list', auth, assetController.getAssetLoans);

router.post('/loans', auth, [
    body('asset_id').isInt().withMessage('请选择资产')
], validate, assetController.createLoan);

router.put('/loans/:id/approve', auth, requireDeptAdmin, assetController.approveLoan);
router.put('/loans/:id/withdraw', auth, assetController.withdrawLoan);
router.post('/loans/batch-approve', auth, requireDeptAdmin, assetController.batchApproveLoans);
router.post('/loans/scan-confirm', auth, requireDeptAdmin, assetController.scanConfirmLoan);
router.post('/loans/scan-return', auth, requireDeptAdmin, assetController.scanReturnAsset);

router.post('/types', auth, requireSuperAdmin, assetController.createAssetType);
router.delete('/types/:id', auth, requireSuperAdmin, assetController.deleteAssetType);
router.delete('/batch/all', auth, requireSuperAdmin, assetController.deleteAllAssets);
router.post('/import', auth, requireSuperAdmin, upload.single('file'), assetController.importAssets);

router.get('/:id', auth, assetController.getAssetById);
router.get('/:id/qrcode', auth, assetController.getAssetQRCode);

router.post('/', auth, [
    body('name').notEmpty().withMessage('资产名称不能为空')
], validate, assetController.createAsset);

router.put('/:id', auth, requireDeptAdmin, assetController.updateAsset);
router.put('/:id/approve', auth, requireDeptAdmin, assetController.approveAsset);
router.put('/:id/reject', auth, requireDeptAdmin, assetController.rejectAsset);
router.put('/:id/confirm-delete', auth, requireDeptAdmin, assetController.confirmDeleteAsset);
router.put('/:id/reject-delete', auth, requireDeptAdmin, assetController.rejectDeleteAsset);
router.delete('/:id', auth, assetController.deleteAsset);

module.exports = router;
