const jwt = require('jsonwebtoken');
const { User } = require('../models');
const config = require('../config');
const { logAction } = require('../middleware/audit');

const login = async (req, res, next) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ code: 400, message: '用户名和密码不能为空' });
        }

        const user = await User.findOne({ where: { username } });

        if (!user) {
            await logAction({
                user: { id: 0, real_name: username, username },
                ip: req.ip,
                module: '认证',
                action: 'login',
                actionName: '用户登录',
                result: 'failed',
                errorMessage: '用户不存在',
                userAgent: req.get('user-agent')
            });
            return res.status(401).json({ code: 401, message: '用户名或密码错误' });
        }

        if (user.status !== 'active') {
            return res.status(401).json({ code: 401, message: '账号已被禁用' });
        }

        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            await logAction({
                user: { id: user.id, real_name: user.real_name, username: user.username },
                ip: req.ip,
                module: '认证',
                action: 'login',
                actionName: '用户登录',
                result: 'failed',
                errorMessage: '密码错误',
                userAgent: req.get('user-agent')
            });
            return res.status(401).json({ code: 401, message: '用户名或密码错误' });
        }

        user.last_login_time = new Date();
        user.last_login_ip = req.ip;
        await user.save();

        const token = jwt.sign(
            {
                userId: user.id,
                username: user.username,
                role: user.role,
                departmentId: user.department_id
            },
            config.jwt.secret,
            { expiresIn: config.jwt.expiresIn }
        );

        await logAction({
            user: { id: user.id, real_name: user.real_name, username: user.username },
            ip: req.ip,
            module: '认证',
            action: 'login',
            actionName: '用户登录',
            result: 'success',
            userAgent: req.get('user-agent')
        });

        res.json({
            code: 200,
            message: '登录成功',
            data: {
                token,
                user: user.toJSON()
            }
        });
    } catch (error) {
        next(error);
    }
};

const register = async (req, res, next) => {
    try {
        const { username, password, real_name, email, phone, department_id } = req.body;

        if (!username || !password || !real_name) {
            return res.status(400).json({ code: 400, message: '用户名、密码和真实姓名不能为空' });
        }

        const existingUser = await User.findOne({ where: { username } });
        if (existingUser) {
            return res.status(400).json({ code: 400, message: '用户名已存在' });
        }

        const user = await User.create({
            username,
            password,
            real_name,
            email,
            phone,
            department_id,
            role: 'normal_user',
            status: 'inactive'
        });

        await logAction({
            user: { id: user.id, real_name: user.real_name, username: user.username },
            ip: req.ip,
            module: '认证',
            action: 'register',
            actionName: '用户注册',
            beforeData: null,
            afterData: { username, real_name, role: 'normal_user' },
            result: 'success',
            userAgent: req.get('user-agent')
        });

        res.status(201).json({
            code: 201,
            message: '注册成功，请等待管理员审核',
            data: null
        });
    } catch (error) {
        next(error);
    }
};

const logout = async (req, res, next) => {
    try {
        await logAction({
            user: { id: req.user.id, real_name: req.user.real_name, username: req.user.username },
            ip: req.ip,
            module: '认证',
            action: 'logout',
            actionName: '用户登出',
            result: 'success',
            userAgent: req.get('user-agent')
        });

        res.json({
            code: 200,
            message: '登出成功',
            data: null
        });
    } catch (error) {
        next(error);
    }
};

const getCurrentUser = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.user.id, {
            include: ['department']
        });

        res.json({
            code: 200,
            message: 'success',
            data: user.toJSON()
        });
    } catch (error) {
        next(error);
    }
};

const changePassword = async (req, res, next) => {
    try {
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({ code: 400, message: '旧密码和新密码不能为空' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ code: 400, message: '新密码长度不能少于6位' });
        }

        const user = await User.findByPk(req.user.id);
        const isMatch = await user.comparePassword(oldPassword);

        if (!isMatch) {
            return res.status(400).json({ code: 400, message: '旧密码错误' });
        }

        user.password = newPassword;
        await user.save();

        await logAction({
            user: { id: user.id, real_name: user.real_name, username: user.username },
            ip: req.ip,
            module: '认证',
            action: 'changePassword',
            actionName: '修改密码',
            result: 'success',
            userAgent: req.get('user-agent')
        });

        res.json({
            code: 200,
            message: '密码修改成功',
            data: null
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    login,
    register,
    logout,
    getCurrentUser,
    changePassword
};
