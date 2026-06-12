const express = require('express');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const { validate } = require('../middleware/validator');

// 登录接口限流：同一IP 15分钟内最多10次登录尝试
// 注意：max设为10而非5，因为学校/企业内网多用户共享同一公网IP（NAT）
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: {
        code: 429,
        message: '登录尝试过于频繁，请15分钟后再试'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// 注册接口限流：同一IP 1小时内最多5次注册
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: {
        code: 429,
        message: '注册请求过于频繁，请1小时后再试'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// 密码重置限流：同一IP 1小时内最多3次
const forgotPasswordLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 3,
    message: {
        code: 429,
        message: '密码重置请求过于频繁，请1小时后再试'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

const router = express.Router();

router.post('/login', loginLimiter, [
    body('username').notEmpty().withMessage('用户名不能为空'),
    body('password').notEmpty().withMessage('密码不能为空')
], validate, authController.login);

router.post('/register', registerLimiter, [
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

router.post('/forgot-password', forgotPasswordLimiter, [
    body('username').notEmpty().withMessage('用户名不能为空'),
    body('newPassword').isLength({ min: 6 }).withMessage('新密码长度不能少于6位')
], validate, authController.forgotPassword);

module.exports = router;
