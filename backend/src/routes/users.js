const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const { auth, requireSuperAdmin, requireDeptAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validator');

const router = express.Router();

router.get('/', auth, userController.getUsers);
router.get('/me/audit-logs', auth, userController.getMyAuditLogs);
router.get('/:id', auth, userController.getUserById);

router.post('/', auth, requireDeptAdmin, [
    body('username').notEmpty().withMessage('用户名不能为空'),
    body('password').isLength({ min: 6 }).withMessage('密码长度不能少于6位'),
    body('real_name').notEmpty().withMessage('真实姓名不能为空')
], validate, userController.createUser);

router.put('/:id', auth, userController.updateUser);

router.delete('/:id', auth, requireDeptAdmin, userController.deleteUser);

router.put('/:id/status', auth, requireSuperAdmin, userController.updateUserStatus);

router.put('/:id/reset-password', auth, requireSuperAdmin, userController.resetPassword);

router.put('/:id/approve', auth, requireDeptAdmin, userController.approveUser);

module.exports = router;
