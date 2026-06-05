const { User, Department, AuditLog } = require('../models');
const { Op } = require('sequelize');
const { logAction, sendSensitiveOperationNotification } = require('../middleware/audit');

const getUsers = async (req, res, next) => {
    try {
        const { page = 1, pageSize = 10, keyword, role, status, department_id } = req.query;
        const offset = (page - 1) * pageSize;
        const where = {};

        if (keyword) {
            where[Op.or] = [
                { username: { [Op.like]: `%${keyword}%` } },
                { real_name: { [Op.like]: `%${keyword}%` } },
                { email: { [Op.like]: `%${keyword}%` } }
            ];
        }

        if (role) where.role = role;
        if (status) where.status = status;
        if (department_id) where.department_id = department_id;

        if (req.user.role === 'dept_admin') {
            if (department_id) where.department_id = department_id;
        }

        const { count, rows } = await User.findAndCountAll({
            where,
            include: [{ model: Department, as: 'department' }],
            offset: parseInt(offset),
            limit: parseInt(pageSize),
            order: [['created_at', 'DESC']]
        });

        res.json({
            code: 200,
            message: 'success',
            data: {
                items: rows.map(u => u.toJSON()),
                total: count,
                page: parseInt(page),
                pageSize: parseInt(pageSize)
            }
        });
    } catch (error) {
        next(error);
    }
};

const getUserById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const user = await User.findByPk(id, {
            include: [{ model: Department, as: 'department' }]
        });

        if (!user) {
            return res.status(404).json({ code: 404, message: '用户不存在' });
        }

        res.json({
            code: 200,
            message: 'success',
            data: user.toJSON()
        });
    } catch (error) {
        next(error);
    }
};

const createUser = async (req, res, next) => {
    try {
        const { username, password, real_name, email, phone, role, department_id, status } = req.body;

        if (req.user.role === 'normal_user') {
            return res.status(403).json({ code: 403, message: '权限不足，普通用户不能创建用户' });
        }

        if (req.user.role === 'dept_admin' && department_id !== req.user.department_id) {
            return res.status(403).json({ code: 403, message: '权限不足，只能创建本部门用户' });
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
            role: role || 'normal_user',
            department_id: req.user.role === 'dept_admin' ? req.user.department_id : department_id,
            status: status || 'active',
            created_by: req.user.id
        });

        await logAction({
            user: { id: req.user.id, real_name: req.user.real_name, username: req.user.username },
            ip: req.ip,
            module: '用户管理',
            action: 'create',
            actionName: '创建用户',
            entityType: 'User',
            entityId: user.id,
            beforeData: null,
            afterData: { username, real_name, role, department_id },
            result: 'success',
            userAgent: req.get('user-agent')
        });

        res.status(201).json({
            code: 201,
            message: '用户创建成功',
            data: user.toJSON()
        });
    } catch (error) {
        next(error);
    }
};

const updateUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { real_name, email, phone, role, department_id, status } = req.body;

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ code: 404, message: '用户不存在' });
        }

        if (req.user.role === 'normal_user') {
            if (user.id !== req.user.id) {
                return res.status(403).json({ code: 403, message: '权限不足' });
            }
            await user.update({ real_name, email, phone });
        } else if (req.user.role === 'dept_admin') {
            if (user.id === req.user.id) {
                await user.update({ real_name, email, phone });
            } else if (user.department_id !== req.user.department_id) {
                return res.status(403).json({ code: 403, message: '权限不足，只能管理本部门用户' });
            } else {
                await user.update({ real_name, email, phone, status });
            }
        } else {
            await user.update({ real_name, email, phone, role, department_id, status });
        }

        const beforeData = user.toJSON();

        await logAction({
            user: { id: req.user.id, real_name: req.user.real_name, username: req.user.username },
            ip: req.ip,
            module: '用户管理',
            action: 'update',
            actionName: '更新用户',
            entityType: 'User',
            entityId: user.id,
            beforeData,
            afterData: user.toJSON(),
            result: 'success',
            userAgent: req.get('user-agent')
        });

        res.json({
            code: 200,
            message: '用户更新成功',
            data: user.toJSON()
        });
    } catch (error) {
        next(error);
    }
};

const deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ code: 400, message: '不能删除自己' });
        }

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ code: 404, message: '用户不存在' });
        }

        if (req.user.role === 'normal_user') {
            return res.status(403).json({ code: 403, message: '权限不足' });
        }

        if (req.user.role === 'dept_admin' && user.department_id !== req.user.department_id) {
            return res.status(403).json({ code: 403, message: '权限不足，只能删除本部门用户' });
        }

        const beforeData = user.toJSON();
        await user.destroy();

        await logAction({
            user: { id: req.user.id, real_name: req.user.real_name, username: req.user.username },
            ip: req.ip,
            module: '用户管理',
            action: 'delete',
            actionName: '删除用户',
            entityType: 'User',
            entityId: parseInt(id),
            beforeData,
            afterData: null,
            result: 'success',
            userAgent: req.get('user-agent')
        });

        await sendSensitiveOperationNotification(
            req.user,
            '删除用户',
            `删除了用户 ${beforeData.real_name}（${beforeData.username}）`,
            '用户管理'
        );

        res.json({
            code: 200,
            message: '用户删除成功',
            data: null
        });
    } catch (error) {
        next(error);
    }
};

const updateUserStatus = async (req, res, next) => {
    try {
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ code: 403, message: '权限不足' });
        }

        const { id } = req.params;
        const { status } = req.body;

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ code: 404, message: '用户不存在' });
        }

        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ code: 400, message: '不能修改自己的状态' });
        }

        const beforeData = user.toJSON();
        await user.update({ status });

        await logAction({
            user: { id: req.user.id, real_name: req.user.real_name, username: req.user.username },
            ip: req.ip,
            module: '用户管理',
            action: 'updateStatus',
            actionName: '更新用户状态',
            entityType: 'User',
            entityId: user.id,
            beforeData,
            afterData: user.toJSON(),
            result: 'success',
            userAgent: req.get('user-agent')
        });

        res.json({
            code: 200,
            message: '状态更新成功',
            data: user.toJSON()
        });
    } catch (error) {
        next(error);
    }
};

const resetPassword = async (req, res, next) => {
    try {
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ code: 403, message: '权限不足' });
        }

        const { id } = req.params;
        const user = await User.findByPk(id);

        if (!user) {
            return res.status(404).json({ code: 404, message: '用户不存在' });
        }

        user.password = 'admin123';
        await user.save();

        await logAction({
            user: { id: req.user.id, real_name: req.user.real_name, username: req.user.username },
            ip: req.ip,
            module: '用户管理',
            action: 'resetPassword',
            actionName: '重置用户密码',
            entityType: 'User',
            entityId: user.id,
            beforeData: null,
            afterData: { username: user.username, newPassword: 'admin123' },
            result: 'success',
            userAgent: req.get('user-agent')
        });

        await sendSensitiveOperationNotification(
            req.user,
            '重置密码',
            `重置了用户 ${user.real_name}（${user.username}）的密码为 admin123`,
            '用户管理'
        );

        res.json({
            code: 200,
            message: '密码已重置为 admin123',
            data: null
        });
    } catch (error) {
        next(error);
    }
};

const approveUser = async (req, res, next) => {
    try {
        if (req.user.role !== 'super_admin' && req.user.role !== 'dept_admin') {
            return res.status(403).json({ code: 403, message: '权限不足，只有管理员可以审核用户' });
        }

        const { id } = req.params;
        const user = await User.findByPk(id);

        if (!user) {
            return res.status(404).json({ code: 404, message: '用户不存在' });
        }

        if (req.user.role === 'dept_admin') {
            if (!req.user.department_id) {
                return res.status(403).json({ code: 403, message: '您尚未分配部门，请联系管理员' });
            }
            if (user.department_id !== req.user.department_id) {
                return res.status(403).json({ code: 403, message: '只能审核本部门的用户' });
            }
        }

        if (user.status !== 'inactive') {
            return res.status(400).json({ code: 400, message: '该用户不需要审核' });
        }

        await user.update({ status: 'active' });

        await logAction({
            user: { id: req.user.id, real_name: req.user.real_name, username: req.user.username },
            ip: req.ip,
            module: '用户管理',
            action: 'approve',
            actionName: '审核通过用户',
            entityType: 'User',
            entityId: user.id,
            result: 'success',
            userAgent: req.get('user-agent')
        });

        res.json({
            code: 200,
            message: '用户已通过审核',
            data: user.toJSON()
        });
    } catch (error) {
        next(error);
    }
};

const getMyAuditLogs = async (req, res, next) => {
    try {
        const { page = 1, pageSize = 20 } = req.query;
        const offset = (page - 1) * pageSize;

        const { count, rows } = await AuditLog.findAndCountAll({
            where: { user_id: req.user.id },
            offset: parseInt(offset),
            limit: parseInt(pageSize),
            order: [['operate_time', 'DESC']]
        });

        res.json({
            code: 200,
            message: 'success',
            data: {
                items: rows,
                total: count,
                page: parseInt(page),
                pageSize: parseInt(pageSize)
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    updateUserStatus,
    resetPassword,
    approveUser,
    getMyAuditLogs
};
