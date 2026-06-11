const jwt = require('jsonwebtoken');
const config = require('../config');
const { User } = require('../models');

const auth = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        const token = authHeader?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ code: 401, message: '未授权，请先登录' });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, config.jwt.secret);
        } catch (jwtError) {
            if (jwtError.name === 'TokenExpiredError') {
                return res.status(401).json({ code: 401, message: '登录已过期，请重新登录' });
            }
            return res.status(401).json({ code: 401, message: '认证失败' });
        }

        const user = await User.findByPk(decoded.userId);

        if (!user) {
            return res.status(401).json({ code: 401, message: '用户不存在' });
        }

        if (user.status !== 'active') {
            return res.status(401).json({ code: 401, message: '账号已被禁用' });
        }

        req.user = user;
        req.token = token;
        next();
    } catch (error) {
        return res.status(401).json({ code: 401, message: '认证失败' });
    }
};

const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ code: 401, message: '未授权，请先登录' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ code: 403, message: '权限不足' });
        }

        next();
    };
};

const requireSuperAdmin = requireRole('super_admin');
const requireDeptAdmin = requireRole('super_admin', 'dept_admin');

module.exports = { auth, requireRole, requireSuperAdmin, requireDeptAdmin };
