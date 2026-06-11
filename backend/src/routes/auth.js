const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const { validate } = require('../middleware/validator');

const router = express.Router();

router.post('/login', [
    body('username').notEmpty().withMessage('用户名不能为空'),
    body('password').notEmpty().withMessage('密码不能为空')
], validate, authController.login);

router.post('/register', [
    body('username').notEmpty().withMessage('用户名不能为空'),
    body('password').isLength({ min: 6 }).withMessage('密码长度不能少于6位'),
    body('real_name').notEmpty().withMessage('真实姓名不能为空')
], validate, authController.register);

router.post('/logout', auth, authController.logout);

router.get('/current', auth, authController.getCurrentUser);

router.put('/password', auth, [
    body('oldPassword').notEmpty().withMessage('旧密码不能为空'),
    body('newPassword').isLength({ min: 6 }).withMessage('新密码长度不能少于6位')
], validate, authController.changePassword);

router.post('/forgot-password', [
    body('username').notEmpty().withMessage('用户名不能为空'),
    body('newPassword').isLength({ min: 6 }).withMessage('新密码长度不能少于6位')
], validate, authController.forgotPassword);

module.exports = router;
