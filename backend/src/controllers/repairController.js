const { RepairApplication, Asset, Department, User } = require('../models');
const { Op } = require('sequelize');
const { logAction, sendNotification } = require('../middleware/audit');
const { generateRepairCode } = require('../utils/codeGenerator');

const getRepairs = async (req, res, next) => {
    try {
        const { page = 1, pageSize = 10, status } = req.query;
        const offset = (page - 1) * pageSize;
        const where = {};

        if (status) where.status = status;

        const { count, rows } = await RepairApplication.findAndCountAll({
            where,
            include: [
                { model: Asset, as: 'asset', attributes: ['id', 'asset_code', 'name', 'serial_number'] },
                { model: User, as: 'reporter', attributes: ['id', 'real_name', 'username'] }
            ],
            offset: parseInt(offset),
            limit: parseInt(pageSize),
            order: [['created_at', 'DESC']]
        });

        res.json({ code: 200, message: 'success', data: { items: rows, total: count, page: parseInt(page), pageSize: parseInt(pageSize) } });
    } catch (error) {
        next(error);
    }
};

const createRepair = async (req, res, next) => {
    try {
        const { asset_id, fault_description, fault_photos } = req.body;

        const asset = await Asset.findByPk(asset_id);
        if (!asset) {
            return res.status(404).json({ code: 404, message: '资产不存在' });
        }

        const repair_code = generateRepairCode();

        const repair = await RepairApplication.create({
            repair_code,
            asset_id,
            asset_name: asset.name,
            reporter_id: req.user.id,
            department_id: req.user.department_id || asset.department_id,
            fault_description,
            fault_photos,
            report_date: new Date(),
            status: 'pending'
        });

        await logAction({
            user: { id: req.user.id, real_name: req.user.real_name, username: req.user.username },
            ip: req.ip,
            module: '维修管理',
            action: 'create',
            actionName: '提交报修申请',
            entityType: 'RepairApplication',
            entityId: repair.id,
            beforeData: null,
            afterData: { repair_code, asset_id },
            result: 'success',
            userAgent: req.get('user-agent')
        });

        res.status(201).json({ code: 201, message: '报修申请已提交', data: repair });
    } catch (error) {
        next(error);
    }
};

const auditRepair = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { action, remark } = req.body;

        if (req.user.role !== 'dept_admin' && req.user.role !== 'super_admin') {
            return res.status(403).json({ code: 403, message: '权限不足' });
        }

        const repair = await RepairApplication.findByPk(id);
        if (!repair) {
            return res.status(404).json({ code: 404, message: '维修申请不存在' });
        }

        if (repair.department_id !== req.user.department_id && req.user.role !== 'super_admin') {
            return res.status(403).json({ code: 403, message: '只能处理本部门的申请' });
        }

        if (repair.audit_status !== 'pending') {
            return res.status(400).json({ code: 400, message: '该申请已审核' });
        }

        if (action === 'approve') {
            repair.audit_status = 'approved';
            repair.audit_id = req.user.id;
            repair.audit_time = new Date();
            repair.audit_remark = remark;
            repair.status = 'in_repair';

            const asset = await Asset.findByPk(repair.asset_id);
            if (asset) {
                asset.status = 'repairing';
                await asset.save();
            }
        } else {
            repair.audit_status = 'rejected';
            repair.audit_id = req.user.id;
            repair.audit_time = new Date();
            repair.audit_remark = remark;
            repair.status = 'rejected';
        }

        await repair.save();

        await logAction({
            user: { id: req.user.id, real_name: req.user.real_name, username: req.user.username },
            ip: req.ip,
            module: '维修管理',
            action: 'audit',
            actionName: action === 'approve' ? '审核通过' : '审核驳回',
            entityType: 'RepairApplication',
            entityId: repair.id,
            result: 'success',
            userAgent: req.get('user-agent')
        });

        res.json({ code: 200, message: action === 'approve' ? '审核通过' : '已驳回', data: repair });
    } catch (error) {
        next(error);
    }
};

const startRepair = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { repair_person } = req.body;

        const repair = await RepairApplication.findByPk(id);
        if (!repair) {
            return res.status(404).json({ code: 404, message: '维修申请不存在' });
        }

        if (repair.status !== 'in_repair') {
            return res.status(400).json({ code: 400, message: '维修还未开始' });
        }

        repair.repair_person = repair_person;
        repair.repair_start_date = new Date();
        await repair.save();

        res.json({ code: 200, message: '维修已开始', data: repair });
    } catch (error) {
        next(error);
    }
};

const completeRepair = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { repair_result, repair_cost } = req.body;

        const repair = await RepairApplication.findByPk(id);
        if (!repair) {
            return res.status(404).json({ code: 404, message: '维修申请不存在' });
        }

        if (repair.status !== 'in_repair') {
            return res.status(400).json({ code: 400, message: '维修还未开始' });
        }

        repair.repair_status = 'completed';
        repair.repair_end_date = new Date();
        repair.repair_result = repair_result;
        repair.repair_cost = repair_cost;
        repair.acceptance_status = 'pending';
        await repair.save();

        await logAction({
            user: { id: req.user.id, real_name: req.user.real_name, username: req.user.username },
            ip: req.ip,
            module: '维修管理',
            action: 'complete',
            actionName: '完成维修',
            entityType: 'RepairApplication',
            entityId: repair.id,
            afterData: { repair_cost },
            result: 'success',
            userAgent: req.get('user-agent')
        });

        res.json({ code: 200, message: '维修已完成，等待验收', data: repair });
    } catch (error) {
        next(error);
    }
};

const acceptanceRepair = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { action, remark } = req.body;

        const repair = await RepairApplication.findByPk(id);
        if (!repair) {
            return res.status(404).json({ code: 404, message: '维修申请不存在' });
        }

        if (repair.repair_status !== 'completed') {
            return res.status(400).json({ code: 400, message: '维修还未完成' });
        }

        if (action === 'accept') {
            repair.acceptance_status = 'accepted';
            repair.status = 'completed';

            const asset = await Asset.findByPk(repair.asset_id);
            if (asset) {
                asset.status = 'idle';
                await asset.save();
            }
        } else {
            repair.acceptance_status = 'rejected';
            repair.acceptance_remark = remark;
        }

        repair.acceptance_id = req.user.id;
        repair.acceptance_time = new Date();
        await repair.save();

        await logAction({
            user: { id: req.user.id, real_name: req.user.real_name, username: req.user.username },
            ip: req.ip,
            module: '维修管理',
            action: 'acceptance',
            actionName: action === 'accept' ? '验收通过' : '验收不通过',
            entityType: 'RepairApplication',
            entityId: repair.id,
            result: 'success',
            userAgent: req.get('user-agent')
        });

        res.json({ code: 200, message: action === 'accept' ? '验收通过' : '验收不通过', data: repair });
    } catch (error) {
        next(error);
    }
};

const withdrawRepair = async (req, res, next) => {
    try {
        const { id } = req.params;

        const repair = await RepairApplication.findByPk(id);

        if (!repair) {
            return res.status(404).json({ code: 404, message: '维修申请不存在' });
        }

        if (repair.reporter_id !== req.user.id) {
            return res.status(403).json({ code: 403, message: '只能撤回自己的申请' });
        }

        if (repair.status !== 'pending') {
            return res.status(400).json({ code: 400, message: '只能撤回待审核的申请' });
        }

        await repair.update({ status: 'withdrawn' });

        await logAction({
            user: { id: req.user.id, real_name: req.user.real_name, username: req.user.username },
            ip: req.ip,
            module: '维修管理',
            action: 'withdraw',
            actionName: '撤回维修申请',
            entityType: 'RepairApplication',
            entityId: repair.id,
            result: 'success',
            userAgent: req.get('user-agent')
        });

        res.json({ code: 200, message: '申请已撤回', data: repair });
    } catch (error) {
        next(error);
    }
};

const batchAuditRepair = async (req, res, next) => {
    try {
        const { ids, action, remark } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ code: 400, message: '请选择要审批的申请' });
        }

        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({ code: 400, message: '无效的操作类型' });
        }

        if (req.user.role !== 'dept_admin' && req.user.role !== 'super_admin') {
            return res.status(403).json({ code: 403, message: '权限不足' });
        }

        const whereClause = { id: ids, status: 'pending' };
        if (req.user.role === 'dept_admin') {
            whereClause.department_id = req.user.department_id;
        }

        const repairs = await RepairApplication.findAll({ where: whereClause });

        if (repairs.length === 0) {
            return res.status(400).json({ code: 400, message: '没有符合条件的申请可审批' });
        }

        for (const repair of repairs) {
            if (action === 'approve') {
                repair.audit_status = 'approved';
                repair.audit_id = req.user.id;
                repair.audit_time = new Date();
                repair.audit_remark = remark;
                repair.status = 'in_repair';

                const asset = await Asset.findByPk(repair.asset_id);
                if (asset) {
                    asset.status = 'repairing';
                    await asset.save();
                }
            } else {
                repair.audit_status = 'rejected';
                repair.audit_id = req.user.id;
                repair.audit_time = new Date();
                repair.audit_remark = remark;
                repair.status = 'rejected';
            }
            await repair.save();

            await logAction({
                user: { id: req.user.id, real_name: req.user.real_name, username: req.user.username },
                ip: req.ip,
                module: '维修管理',
                action: 'batchAudit',
                actionName: `批量${action === 'approve' ? '通过' : '驳回'}`,
                entityType: 'RepairApplication',
                entityId: repair.id,
                result: 'success',
                userAgent: req.get('user-agent')
            });
        }

        res.json({ 
            code: 200, 
            message: `已${action === 'approve' ? '通过' : '驳回'} ${repairs.length} 条申请`, 
            data: { count: repairs.length } 
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { getRepairs, createRepair, auditRepair, startRepair, completeRepair, acceptanceRepair, withdrawRepair, batchAuditRepair };
