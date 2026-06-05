const { PurchaseApplication, Department, User, Asset, AssetType } = require('../models');
const { Op } = require('sequelize');
const { logAction, sendNotification } = require('../middleware/audit');
const { generatePurchaseCode } = require('../utils/codeGenerator');

const getPurchases = async (req, res, next) => {
    try {
        const { page = 1, pageSize = 10, status } = req.query;
        const offset = (page - 1) * pageSize;
        const where = {};

        if (status) where.status = status;

        const { count, rows } = await PurchaseApplication.findAndCountAll({
            where,
            include: [
                { model: User, as: 'applicant', attributes: ['id', 'real_name', 'username'] },
                { model: Department, as: 'department', attributes: ['id', 'name'] },
                { model: AssetType, as: 'type', attributes: ['id', 'name'] }
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

const getPurchaseById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const purchase = await PurchaseApplication.findByPk(id, {
            include: [
                { model: User, as: 'applicant', attributes: ['id', 'real_name', 'username'] },
                { model: Department, as: 'department', attributes: ['id', 'name'] },
                { model: AssetType, as: 'type', attributes: ['id', 'name'] }
            ]
        });

        if (!purchase) {
            return res.status(404).json({ code: 404, message: '采购申请不存在' });
        }

        res.json({ code: 200, message: 'success', data: purchase });
    } catch (error) {
        next(error);
    }
};

const createPurchase = async (req, res, next) => {
    try {
        const { name, type_id, spec, quantity, estimated_price, purpose, required_date } = req.body;

        const application_code = generatePurchaseCode();
        const total_price = (estimated_price || 0) * (quantity || 1);

        const purchase = await PurchaseApplication.create({
            application_code,
            name,
            type_id,
            spec,
            quantity: quantity || 1,
            estimated_price,
            total_price,
            purpose,
            required_date,
            applicant_id: req.user.id,
            department_id: req.user.department_id,
            status: 'dept_pending'
        });

        await logAction({
            user: { id: req.user.id, real_name: req.user.real_name, username: req.user.username },
            ip: req.ip,
            module: '采购管理',
            action: 'create',
            actionName: '提交采购申请',
            entityType: 'PurchaseApplication',
            entityId: purchase.id,
            beforeData: null,
            afterData: { application_code, name, quantity },
            result: 'success',
            userAgent: req.get('user-agent')
        });

        res.status(201).json({
            code: 201,
            message: '采购申请已提交',
            data: purchase
        });
    } catch (error) {
        next(error);
    }
};

const deptAudit = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { action, remark } = req.body;

        if (req.user.role !== 'dept_admin' && req.user.role !== 'super_admin') {
            return res.status(403).json({ code: 403, message: '权限不足' });
        }

        const purchase = await PurchaseApplication.findByPk(id);
        if (!purchase) {
            return res.status(404).json({ code: 404, message: '采购申请不存在' });
        }

        if (purchase.department_id !== req.user.department_id && req.user.role !== 'super_admin') {
            return res.status(403).json({ code: 403, message: '只能审批本部门的申请' });
        }

        if (!['dept_pending'].includes(purchase.status)) {
            return res.status(400).json({ code: 400, message: '该申请不在部门待审状态' });
        }

        const beforeData = purchase.toJSON();

        if (action === 'approve') {
            purchase.dept_audit_status = 'approved';
            purchase.dept_audit_id = req.user.id;
            purchase.dept_audit_time = new Date();
            purchase.dept_audit_remark = remark;
            purchase.status = 'super_pending';

            await sendNotification({
                title: '采购申请待审批',
                content: `采购申请 ${purchase.application_code} 已通过部门审核，等待超级管理员审批`,
                type: 'approval',
                senderId: req.user.id,
                recipientRole: 'super_admin',
                relatedModule: 'purchase',
                relatedId: purchase.id
            });
        } else {
            purchase.dept_audit_status = 'rejected';
            purchase.dept_audit_id = req.user.id;
            purchase.dept_audit_time = new Date();
            purchase.dept_audit_remark = remark;
            purchase.status = 'rejected';
        }

        await purchase.save();

        await logAction({
            user: { id: req.user.id, real_name: req.user.real_name, username: req.user.username },
            ip: req.ip,
            module: '采购管理',
            action: 'deptAudit',
            actionName: action === 'approve' ? '部门审核通过' : '部门审核驳回',
            entityType: 'PurchaseApplication',
            entityId: purchase.id,
            beforeData,
            afterData: purchase.toJSON(),
            result: 'success',
            userAgent: req.get('user-agent')
        });

        res.json({ code: 200, message: action === 'approve' ? '审核通过' : '已驳回', data: purchase });
    } catch (error) {
        next(error);
    }
};

const superAudit = async (req, res, next) => {
    try {
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ code: 403, message: '权限不足' });
        }

        const { id } = req.params;
        const { action, remark } = req.body;

        const purchase = await PurchaseApplication.findByPk(id);
        if (!purchase) {
            return res.status(404).json({ code: 404, message: '采购申请不存在' });
        }

        if (!['dept_pending', 'super_pending'].includes(purchase.status)) {
            return res.status(400).json({ code: 400, message: '该申请不在待审状态' });
        }

        const beforeData = purchase.toJSON();

        if (purchase.status === 'dept_pending') {
            purchase.dept_audit_status = 'approved';
            purchase.dept_audit_id = req.user.id;
            purchase.dept_audit_time = new Date();
            purchase.dept_audit_remark = '超级管理员直接审批';
        }

        if (action === 'approve') {
            purchase.super_audit_status = 'approved';
            purchase.super_audit_id = req.user.id;
            purchase.super_audit_time = new Date();
            purchase.super_audit_remark = remark;
            purchase.status = 'approved';
        } else {
            purchase.super_audit_status = 'rejected';
            purchase.super_audit_id = req.user.id;
            purchase.super_audit_time = new Date();
            purchase.super_audit_remark = remark;
            purchase.status = 'rejected';
        }

        await purchase.save();

        await logAction({
            user: { id: req.user.id, real_name: req.user.real_name, username: req.user.username },
            ip: req.ip,
            module: '采购管理',
            action: 'superAudit',
            actionName: action === 'approve' ? '超级管理员审核通过' : '超级管理员审核驳回',
            entityType: 'PurchaseApplication',
            entityId: purchase.id,
            beforeData,
            afterData: purchase.toJSON(),
            result: 'success',
            userAgent: req.get('user-agent')
        });

        await sendNotification({
            title: `采购申请${action === 'approve' ? '已通过' : '已驳回'}`,
            content: `您的采购申请 ${purchase.application_code} ${action === 'approve' ? '已通过最终审批' : '已被驳回'}`,
            type: 'approval',
            senderId: req.user.id,
            recipient_id: purchase.applicant_id,
            relatedModule: 'purchase',
            relatedId: purchase.id
        });

        res.json({ code: 200, message: action === 'approve' ? '审核通过' : '已驳回', data: purchase });
    } catch (error) {
        next(error);
    }
};

const withdrawPurchase = async (req, res, next) => {
    try {
        const { id } = req.params;

        const purchase = await PurchaseApplication.findByPk(id);
        if (!purchase) {
            return res.status(404).json({ code: 404, message: '采购申请不存在' });
        }

        if (purchase.applicant_id !== req.user.id) {
            return res.status(403).json({ code: 403, message: '只能撤回自己的申请' });
        }

        if (!['draft', 'dept_pending', 'super_pending'].includes(purchase.status)) {
            return res.status(400).json({ code: 400, message: '该申请无法撤回' });
        }

        purchase.status = 'withdrawn';
        await purchase.save();

        await logAction({
            user: { id: req.user.id, real_name: req.user.real_name, username: req.user.username },
            ip: req.ip,
            module: '采购管理',
            action: 'withdraw',
            actionName: '撤回采购申请',
            entityType: 'PurchaseApplication',
            entityId: purchase.id,
            result: 'success',
            userAgent: req.get('user-agent')
        });

        res.json({ code: 200, message: '申请已撤回', data: purchase });
    } catch (error) {
        next(error);
    }
};

const batchAudit = async (req, res, next) => {
    try {
        const { ids, action, auditType, remark } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ code: 400, message: '请选择要审批的申请' });
        }

        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({ code: 400, message: '无效的操作类型' });
        }

        if (!['dept', 'super'].includes(auditType)) {
            return res.status(400).json({ code: 400, message: '无效的审批类型' });
        }

        if (auditType === 'dept' && req.user.role !== 'dept_admin' && req.user.role !== 'super_admin') {
            return res.status(403).json({ code: 403, message: '权限不足' });
        }

        if (auditType === 'super' && req.user.role !== 'super_admin') {
            return res.status(403).json({ code: 403, message: '权限不足' });
        }

        let whereClause = { id: ids };
        if (auditType === 'dept') {
            whereClause.status = 'dept_pending';
            if (req.user.role === 'dept_admin') {
                whereClause.department_id = req.user.department_id;
            }
        } else {
            whereClause.status = { [Op.in]: ['dept_pending', 'super_pending'] };
        }

        const purchases = await PurchaseApplication.findAll({ where: whereClause });

        if (purchases.length === 0) {
            return res.status(400).json({ code: 400, message: '没有符合条件的申请可审批' });
        }

        for (const purchase of purchases) {
            const beforeData = purchase.toJSON();

            if (auditType === 'super' && purchase.status === 'dept_pending') {
                purchase.dept_audit_status = 'approved';
                purchase.dept_audit_id = req.user.id;
                purchase.dept_audit_time = new Date();
                purchase.dept_audit_remark = '超级管理员直接审批';
            }

            if (action === 'approve') {
                if (auditType === 'dept') {
                    purchase.status = 'super_pending';
                    purchase.dept_audit_status = 'approved';
                    purchase.dept_audit_id = req.user.id;
                    purchase.dept_audit_time = new Date();
                    purchase.dept_audit_remark = remark;
                } else {
                    purchase.status = 'approved';
                    purchase.super_audit_status = 'approved';
                    purchase.super_audit_id = req.user.id;
                    purchase.super_audit_time = new Date();
                    purchase.super_audit_remark = remark;
                }
            } else {
                purchase.status = 'rejected';
                if (auditType === 'dept') {
                    purchase.dept_audit_status = 'rejected';
                    purchase.dept_audit_id = req.user.id;
                    purchase.dept_audit_time = new Date();
                    purchase.dept_audit_remark = remark;
                } else {
                    purchase.super_audit_status = 'rejected';
                    purchase.super_audit_id = req.user.id;
                    purchase.super_audit_time = new Date();
                    purchase.super_audit_remark = remark;
                }
            }

            await purchase.save();

            await logAction({
                user: { id: req.user.id, real_name: req.user.real_name, username: req.user.username },
                ip: req.ip,
                module: '采购管理',
                action: 'batchAudit',
                actionName: `批量${action === 'approve' ? '通过' : '驳回'}`,
                entityType: 'PurchaseApplication',
                entityId: purchase.id,
                beforeData,
                afterData: purchase.toJSON(),
                result: 'success',
                userAgent: req.get('user-agent')
            });
        }

        res.json({ 
            code: 200, 
            message: `已${action === 'approve' ? '通过' : '驳回'} ${purchases.length} 条申请`, 
            data: { count: purchases.length } 
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { getPurchases, getPurchaseById, createPurchase, deptAudit, superAudit, withdrawPurchase, batchAudit };
