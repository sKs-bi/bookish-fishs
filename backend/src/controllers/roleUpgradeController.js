const { RoleUpgradeRequest, User } = require('../models');
const { Op } = require('sequelize');
const { logAction } = require('../middleware/audit');

const getUpgradeTargets = async (req, res, next) => {
    try {
        const currentRole = req.user.role;
        let targets = [];

        if (currentRole === 'normal_user') {
            targets = [
                { value: 'dept_admin', label: '系管理员' },
                { value: 'super_admin', label: '超级管理员' }
            ];
        } else if (currentRole === 'dept_admin') {
            targets = [
                { value: 'super_admin', label: '超级管理员' }
            ];
        }

        res.json({ code: 200, message: 'success', data: targets });
    } catch (error) {
        next(error);
    }
};

const getMyRequests = async (req, res, next) => {
    try {
        const { page = 1, pageSize = 10, status } = req.query;
        const offset = (page - 1) * pageSize;
        const where = { user_id: req.user.id };

        if (status) where.status = status;

        const { count, rows } = await RoleUpgradeRequest.findAndCountAll({
            where,
            include: [{ model: User, as: 'reviewer', attributes: ['id', 'real_name', 'username'] }],
            offset: parseInt(offset),
            limit: parseInt(pageSize),
            order: [['created_at', 'DESC']]
        });

        res.json({
            code: 200,
            message: 'success',
            data: { items: rows, total: count, page: parseInt(page), pageSize: parseInt(pageSize) }
        });
    } catch (error) {
        next(error);
    }
};

const createRequest = async (req, res, next) => {
    try {
        const { target_role, reason } = req.body;
        const currentRole = req.user.role;

        if (currentRole === 'super_admin') {
            return res.status(400).json({ code: 400, message: '超级管理员无需申请升级' });
        }

        const validTargets = {
            'normal_user': ['dept_admin', 'super_admin'],
            'dept_admin': ['super_admin']
        };

        if (!validTargets[currentRole]?.includes(target_role)) {
            return res.status(400).json({ code: 400, message: '无效的升级目标' });
        }

        const existingPending = await RoleUpgradeRequest.findOne({
            where: { user_id: req.user.id, status: 'pending' }
        });

        if (existingPending) {
            return res.status(400).json({ code: 400, message: '您已有待审核的申请，请等待审批结果' });
        }

        const request = await RoleUpgradeRequest.create({
            user_id: req.user.id,
            current_role: currentRole,
            target_role,
            reason,
            status: 'pending'
        });

        await logAction({
            user: { id: req.user.id, real_name: req.user.real_name, username: req.user.username },
            ip: req.ip,
            module: '角色升级',
            action: 'create',
            actionName: '提交升级申请',
            entityType: 'RoleUpgradeRequest',
            entityId: request.id,
            beforeData: null,
            afterData: { current_role: currentRole, target_role, reason },
            result: 'success',
            userAgent: req.get('user-agent')
        });

        res.status(201).json({
            code: 201,
            message: '申请已提交，请等待超级管理员审批',
            data: request
        });
    } catch (error) {
        next(error);
    }
};

const cancelRequest = async (req, res, next) => {
    try {
        const { id } = req.params;

        const request = await RoleUpgradeRequest.findOne({
            where: { id, user_id: req.user.id }
        });

        if (!request) {
            return res.status(404).json({ code: 404, message: '申请不存在' });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({ code: 400, message: '只能撤销待审核的申请' });
        }

        await request.destroy();

        await logAction({
            user: { id: req.user.id, real_name: req.user.real_name, username: req.user.username },
            ip: req.ip,
            module: '角色升级',
            action: 'cancel',
            actionName: '撤销升级申请',
            entityType: 'RoleUpgradeRequest',
            entityId: parseInt(id),
            beforeData: request.toJSON(),
            afterData: null,
            result: 'success',
            userAgent: req.get('user-agent')
        });

        res.json({ code: 200, message: '申请已撤销', data: null });
    } catch (error) {
        next(error);
    }
};

const getAllRequests = async (req, res, next) => {
    try {
        const { page = 1, pageSize = 10, status } = req.query;
        const offset = (page - 1) * pageSize;
        const where = {};

        if (status) where.status = status;

        const { count, rows } = await RoleUpgradeRequest.findAndCountAll({
            where,
            include: [
                { model: User, as: 'user', attributes: ['id', 'username', 'real_name', 'email', 'phone'], include: [{ model: require('../models').Department, as: 'department', attributes: ['id', 'name'] }] },
                { model: User, as: 'reviewer', attributes: ['id', 'real_name', 'username'] }
            ],
            offset: parseInt(offset),
            limit: parseInt(pageSize),
            order: [['created_at', 'DESC']]
        });

        res.json({
            code: 200,
            message: 'success',
            data: { items: rows, total: count, page: parseInt(page), pageSize: parseInt(pageSize) }
        });
    } catch (error) {
        next(error);
    }
};

const approveRequest = async (req, res, next) => {
    try {
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ code: 403, message: '权限不足' });
        }

        const { id } = req.params;
        const { comment } = req.body;

        const request = await RoleUpgradeRequest.findByPk(id, {
            include: [{ model: User, as: 'user' }]
        });

        if (!request) {
            return res.status(404).json({ code: 404, message: '申请不存在' });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({ code: 400, message: '该申请已处理' });
        }

        const user = await User.findByPk(request.user_id);
        if (!user) {
            return res.status(404).json({ code: 404, message: '申请人不存在' });
        }

        const beforeData = { role: user.role };

        await request.update({
            status: 'approved',
            reviewed_by: req.user.id,
            review_comment: comment || '审批通过',
            reviewed_at: new Date()
        });

        await user.update({ role: request.target_role });

        await logAction({
            user: { id: req.user.id, real_name: req.user.real_name, username: req.user.username },
            ip: req.ip,
            module: '角色升级',
            action: 'approve',
            actionName: '审批通过升级申请',
            entityType: 'RoleUpgradeRequest',
            entityId: request.id,
            beforeData: beforeData,
            afterData: { role: request.target_role, review_comment: comment },
            result: 'success',
            userAgent: req.get('user-agent')
        });

        res.json({ code: 200, message: '审批通过，用户角色已更新', data: request });
    } catch (error) {
        next(error);
    }
};

const rejectRequest = async (req, res, next) => {
    try {
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ code: 403, message: '权限不足' });
        }

        const { id } = req.params;
        const { comment } = req.body;

        const request = await RoleUpgradeRequest.findByPk(id);

        if (!request) {
            return res.status(404).json({ code: 404, message: '申请不存在' });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({ code: 400, message: '该申请已处理' });
        }

        await request.update({
            status: 'rejected',
            reviewed_by: req.user.id,
            review_comment: comment || '审批拒绝',
            reviewed_at: new Date()
        });

        await logAction({
            user: { id: req.user.id, real_name: req.user.real_name, username: req.user.username },
            ip: req.ip,
            module: '角色升级',
            action: 'reject',
            actionName: '审批拒绝升级申请',
            entityType: 'RoleUpgradeRequest',
            entityId: request.id,
            beforeData: null,
            afterData: { review_comment: comment },
            result: 'success',
            userAgent: req.get('user-agent')
        });

        res.json({ code: 200, message: '已拒绝该申请', data: request });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getUpgradeTargets,
    getMyRequests,
    createRequest,
    cancelRequest,
    getAllRequests,
    approveRequest,
    rejectRequest
};
