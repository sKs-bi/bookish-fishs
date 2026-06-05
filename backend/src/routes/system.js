const express = require('express');
const systemController = require('../controllers/systemController');
const { auth, requireSuperAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/audit-logs', auth, systemController.getAuditLogs);

router.get('/notifications', auth, systemController.getNotifications);
router.put('/notifications/:id/read', auth, systemController.markNotificationRead);
router.put('/notifications/read-all', auth, systemController.markAllNotificationsRead);

router.get('/system-configs', auth, systemController.getSystemConfigs);
router.put('/system-configs', auth, requireSuperAdmin, systemController.updateSystemConfigs);

router.post('/backups', auth, requireSuperAdmin, systemController.createBackup);
router.get('/backups', auth, requireSuperAdmin, systemController.getBackups);
router.post('/backups/:id/restore', auth, requireSuperAdmin, systemController.restoreBackup);

router.get('/statistics', auth, systemController.getStatistics);

module.exports = router;
