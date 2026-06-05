const { AuditLog, Notification, SystemConfig, BackupRecord, sequelize } = require('../models');
const { Op } = require('sequelize');
const { logAction } = require('../middleware/audit');
const fs = require('fs');
const path = require('path');
const config = require('../config');

const getAuditLogs = async (req, res, next) => {
    try {
        const { page = 1, pageSize = 20, module, action, start_date, end_date, keyword } = req.query;
        const offset = (page - 1) * pageSize;
        const where = {};

        if (module) where.module = module;
        if (action) where.action = action;
        if (start_date) where.operate_time = { ...where.operate_time, [Op.gte]: new Date(start_date) };
        if (end_date) where.operate_time = { ...where.operate_time, [Op.lte]: new Date(end_date + ' 23:59:59') };

        if (keyword) {
            where[Op.or] = [
                { user_name: { [Op.like]: `%${keyword}%` } },
                { user_code: { [Op.like]: `%${keyword}%` } },
                { action_name: { [Op.like]: `%${keyword}%` } }
            ];
        }

        if (req.user.role === 'dept_admin') {
            where.user_id = { [Op.in]: sequelize.literal(`(SELECT id FROM users WHERE department_id = ${req.user.department_id})`) };
        } else if (req.user.role === 'normal_user') {
            where.user_id = req.user.id;
        }

        const { count, rows } = await AuditLog.findAndCountAll({
            where,
            offset: parseInt(offset),
            limit: parseInt(pageSize),
            order: [['operate_time', 'DESC']]
        });

        res.json({ code: 200, message: 'success', data: { items: rows, total: count, page: parseInt(page), pageSize: parseInt(pageSize) } });
    } catch (error) {
        next(error);
    }
};

const getNotifications = async (req, res, next) => {
    try {
        const { page = 1, pageSize = 20, is_read } = req.query;
        const offset = (page - 1) * pageSize;
        const where = {
            [Op.or]: [
                { recipient_id: req.user.id },
                { recipient_role: req.user.role },
                { recipient_id: null }
            ]
        };

        if (is_read !== undefined) {
            where.is_read = is_read === 'true' ? 1 : 0;
        }

        const { count, rows } = await Notification.findAndCountAll({
            where,
            offset: parseInt(offset),
            limit: parseInt(pageSize),
            order: [['created_at', 'DESC']]
        });

        res.json({ code: 200, message: 'success', data: { items: rows, total: count, page: parseInt(page), pageSize: parseInt(pageSize) } });
    } catch (error) {
        next(error);
    }
};

const markNotificationRead = async (req, res, next) => {
    try {
        const { id } = req.params;

        const notification = await Notification.findByPk(id);
        if (!notification) {
            return res.status(404).json({ code: 404, message: '通知不存在' });
        }

        notification.is_read = 1;
        notification.read_time = new Date();
        await notification.save();

        res.json({ code: 200, message: '已标记为已读', data: notification });
    } catch (error) {
        next(error);
    }
};

const markAllNotificationsRead = async (req, res, next) => {
    try {
        await Notification.update(
            { is_read: 1, read_time: new Date() },
            { where: { recipient_id: req.user.id, is_read: 0 } }
        );

        res.json({ code: 200, message: '全部已标记为已读', data: null });
    } catch (error) {
        next(error);
    }
};

const getSystemConfigs = async (req, res, next) => {
    try {
        const configs = await SystemConfig.findAll();

        const configMap = {};
        configs.forEach(c => {
            configMap[c.config_key] = c.config_value;
        });

        res.json({ code: 200, message: 'success', data: configMap });
    } catch (error) {
        next(error);
    }
};

const updateSystemConfigs = async (req, res, next) => {
    try {
        console.log('[SYSTEM] updateSystemConfigs called by user:', req.user?.username, 'role:', req.user?.role);
        
        if (req.user.role !== 'super_admin') {
            console.log('[SYSTEM] Permission denied, user role:', req.user.role);
            return res.status(403).json({ code: 403, message: '权限不足' });
        }

        const configs = req.body;
        console.log('[SYSTEM] Configs to update:', JSON.stringify(configs));

        for (const [key, value] of Object.entries(configs)) {
            const config = await SystemConfig.findOne({ where: { config_key: key } });
            if (config && config.editable) {
                await config.update({ config_value: value });
                console.log('[SYSTEM] Updated config:', key, '=', value);
            } else {
                console.log('[SYSTEM] Config not found or not editable:', key);
            }
        }

        await logAction({
            user: { id: req.user.id, real_name: req.user.real_name, username: req.user.username },
            ip: req.ip,
            module: '系统配置',
            action: 'update',
            actionName: '更新系统配置',
            result: 'success',
            userAgent: req.get('user-agent')
        });

        console.log('[SYSTEM] Config update success');
        res.json({ code: 200, message: '配置更新成功', data: null });
    } catch (error) {
        console.error('[SYSTEM] Update error:', error);
        next(error);
    }
};

const createBackup = async (req, res, next) => {
    try {
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ code: 403, message: '权限不足' });
        }

        const timestamp = new Date().toISOString().replace(/[:-]/g, '').replace('T', '_').substring(0, 15);
        const backupName = `backup_${timestamp}.sqlite`;
        const backupDir = path.join(__dirname, '../../backups');
        const dbPath = path.join(__dirname, '../../database.sqlite');
        const backupPath = path.join(backupDir, backupName);

        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        if (!fs.existsSync(dbPath)) {
            return res.status(400).json({ code: 400, message: '数据库文件不存在' });
        }

        fs.copyFileSync(dbPath, backupPath);

        const stats = fs.statSync(backupPath);

        const record = await BackupRecord.create({
            backup_name: backupName,
            backup_file: backupPath,
            backup_type: 'manual',
            backup_size: stats.size,
            status: 'success',
            backup_by: req.user.id
        });

        await logAction({
            user: { id: req.user.id, real_name: req.user.real_name, username: req.user.username },
            ip: req.ip,
            module: '系统管理',
            action: 'backup',
            actionName: '手动备份数据库',
            entityType: 'BackupRecord',
            entityId: record.id,
            result: 'success',
            userAgent: req.get('user-agent')
        });

        res.json({ code: 200, message: '备份成功', data: record });
    } catch (error) {
        res.status(500).json({ code: 500, message: '备份失败: ' + error.message });
    }
};

const getBackups = async (req, res, next) => {
    try {
        const { page = 1, pageSize = 10 } = req.query;
        const offset = (page - 1) * pageSize;

        const { count, rows } = await BackupRecord.findAndCountAll({
            offset: parseInt(offset),
            limit: parseInt(pageSize),
            order: [['created_at', 'DESC']]
        });

        res.json({ code: 200, message: 'success', data: { items: rows, total: count, page: parseInt(page), pageSize: parseInt(pageSize) } });
    } catch (error) {
        next(error);
    }
};

const restoreBackup = async (req, res, next) => {
    try {
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ code: 403, message: '权限不足' });
        }

        const { id } = req.params;

        const backup = await BackupRecord.findByPk(id);
        if (!backup) {
            return res.status(404).json({ code: 404, message: '备份记录不存在' });
        }

        if (!fs.existsSync(backup.backup_file)) {
            return res.status(400).json({ code: 400, message: '备份文件不存在' });
        }

        const dbPath = path.join(__dirname, '../../database.sqlite');

        await sequelize.close();

        fs.copyFileSync(backup.backup_file, dbPath);

        await logAction({
            user: { id: req.user.id, real_name: req.user.real_name, username: req.user.username },
            ip: req.ip,
            module: '系统管理',
            action: 'restore',
            actionName: '恢复数据库备份',
            entityType: 'BackupRecord',
            entityId: backup.id,
            result: 'success',
            userAgent: req.get('user-agent')
        });

        res.json({ code: 200, message: '数据恢复成功，请重启服务器', data: null });
    } catch (error) {
        res.status(500).json({ code: 500, message: '恢复失败: ' + error.message });
    }
};

const getStatistics = async (req, res, next) => {
    try {
        const { Asset, Department, User, AssetLoan, PurchaseApplication, RepairApplication } = require('../models');

        const totalAssets = await Asset.count();
        const idleAssets = await Asset.count({ where: { status: 'idle' } });
        const inUseAssets = await Asset.count({ where: { status: 'in_use' } });
        const repairingAssets = await Asset.count({ where: { status: 'repairing' } });
        const scrappedAssets = await Asset.count({ where: { status: 'scrapped' } });

        const totalValueResult = await Asset.sum('purchase_price');
        const totalValue = totalValueResult || 0;

        const totalDeptAssets = await Department.count();

        const pendingLoans = await AssetLoan.count({ where: { status: 'pending' } });
        const overdueLoans = await AssetLoan.count({ where: { status: 'overdue' } });

        const pendingPurchases = await PurchaseApplication.count({ where: { status: { [Op.in]: ['dept_pending', 'super_pending'] } } });

        const pendingRepairs = await RepairApplication.count({ where: { status: { [Op.in]: ['pending', 'in_repair'] } } });

        const totalRepairCost = await RepairApplication.sum('repair_cost') || 0;

        const statusDistribution = await Asset.findAll({
            attributes: ['status', [sequelize.fn('COUNT', sequelize.col('status')), 'count']],
            group: ['status'],
            raw: true
        });

        // 使用原生SQL查询解决MySQL only_full_group_by模式兼容问题
        const deptDistribution = await sequelize.query(`
            SELECT 
                a.department_id,
                d.name as 'department.name',
                COUNT(a.id) as count,
                COALESCE(SUM(a.purchase_price), 0) as total_value
            FROM assets a
            LEFT JOIN departments d ON a.department_id = d.id
            GROUP BY a.department_id, d.name
        `, {
            type: sequelize.QueryTypes.SELECT
        });

        res.json({
            code: 200,
            message: 'success',
            data: {
                overview: {
                    totalAssets,
                    idleAssets,
                    inUseAssets,
                    repairingAssets,
                    scrappedAssets,
                    totalValue,
                    totalDeptAssets,
                    pendingLoans,
                    overdueLoans,
                    pendingPurchases,
                    pendingRepairs,
                    totalRepairCost
                },
                statusDistribution,
                deptDistribution
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAuditLogs,
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    getSystemConfigs,
    updateSystemConfigs,
    createBackup,
    getBackups,
    restoreBackup,
    getStatistics
};
