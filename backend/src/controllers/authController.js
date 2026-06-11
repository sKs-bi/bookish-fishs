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

        // 基础验证
        if (!username || !password || !real_name) {
            return res.status(400).json({ code: 400, message: '用户名、密码和真实姓名不能为空' });
        }

        if (!phone) {
            return res.status(400).json({ code: 400, message: '手机号不能为空' });
        }

        // 用户名验证
        if (username.length < 4 || username.length > 20) {
            return res.status(400).json({ code: 400, message: '用户名长度为4-20个字符' });
        }
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            return res.status(400).json({ code: 400, message: '用户名只能包含字母、数字、下划线' });
        }

        // 密码验证
        if (password.length < 6 || password.length > 20) {
            return res.status(400).json({ code: 400, message: '密码长度为6-20个字符' });
        }
        if (!/[a-zA-Z]/.test(password)) {
            return res.status(400).json({ code: 400, message: '密码必须包含字母' });
        }
        if (!/\d/.test(password)) {
            return res.status(400).json({ code: 400, message: '密码必须包含数字' });
        }

        // 真实姓名验证
        if (real_name.length < 2 || real_name.length > 20) {
            return res.status(400).json({ code: 400, message: '真实姓名长度为2-20个字符' });
        }
        if (!/^[\u4e00-\u9fa5a-zA-Z]+$/.test(real_name)) {
            return res.status(400).json({ code: 400, message: '真实姓名只能包含中文或字母' });
        }

        // 手机号验证
        if (!/^1[2-9]\d{9}$/.test(phone)) {
            return res.status(400).json({ code: 400, message: '请输入正确的11位手机号' });
        }

        // 邮箱验证（如果填写了）
        if (email && !/^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/.test(email)) {
            return res.status(400).json({ code: 400, message: '请输入正确的邮箱格式' });
        }

        // 检查用户名是否已存在
        const existingUser = await User.findOne({ where: { username } });
        if (existingUser) {
            return res.status(400).json({ code: 400, message: '用户名已存在' });
        }

        // 检查手机号是否已存在
        const existingPhone = await User.findOne({ where: { phone } });
        if (existingPhone) {
            return res.status(400).json({ code: 400, message: '该手机号已被注册' });
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

const forgotPassword = async (req, res, next) => {
    try {
        const { username, newPassword } = req.body;

        if (!username || !newPassword) {
            return res.status(400).json({ code: 400, message: '用户名和新密码不能为空' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ code: 400, message: '新密码长度不能少于6位' });
        }

        const user = await User.findOne({ where: { username } });

        if (!user) {
            return res.status(404).json({ code: 404, message: '用户不存在' });
        }

        user.password = newPassword;
        await user.save();

        await logAction({
            user: { id: user.id, real_name: user.real_name, username: user.username },
            ip: req.ip,
            module: '认证',
            action: 'forgotPassword',
            actionName: '重置密码',
            result: 'success',
            userAgent: req.get('user-agent')
        });

        res.json({
            code: 200,
            message: '密码重置成功',
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
    changePassword,
    forgotPassword
};
