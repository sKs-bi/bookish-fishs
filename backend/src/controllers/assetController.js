const { Asset, AssetType, Department, User, AssetLoan, AssetRejection } = require('../models');
const { Op } = require('sequelize');
const { logAction, sendSensitiveOperationNotification } = require('../middleware/audit');
const { generateAssetCode } = require('../utils/codeGenerator');
const { generateAssetQRCode } = require('../utils/qrcode');

const getAssets = async (req, res, next) => {
    try {
        const { page = 1, pageSize = 10, keyword, type_id, department_id, status, responsible_id } = req.query;
        const offset = (page - 1) * pageSize;
        const where = {};

        if (keyword) {
            where[Op.or] = [
                { asset_code: { [Op.like]: `%${keyword}%` } },
                { serial_number: { [Op.like]: `%${keyword}%` } },
                { name: { [Op.like]: `%${keyword}%` } }
            ];
        }

        if (type_id) where.type_id = type_id;
        if (status) where.status = status;
        if (responsible_id) where.responsible_id = responsible_id;

        if (req.user.role === 'dept_admin') {
            if (department_id) where.department_id = department_id;
        } else if (req.user.role === 'super_admin') {
            if (department_id) where.department_id = department_id;
        }

        const { count, rows } = await Asset.findAndCountAll({
            where,
            include: [
                { model: AssetType, as: 'type', attributes: ['id', 'name', 'code'] },
                { model: Department, as: 'department', attributes: ['id', 'name', 'code'] },
                { model: User, as: 'responsible', attributes: ['id', 'real_name', 'username'] }
            ],
            offset: parseInt(offset),
            limit: parseInt(pageSize),
            order: [['created_at', 'DESC']]
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

const getAssetById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const asset = await Asset.findByPk(id, {
            include: [
                { model: AssetType, as: 'type' },
                { model: Department, as: 'department' },
                { model: User, as: 'responsible', attributes: ['id', 'real_name', 'username', 'phone', 'email'] }
            ]
        });

        if (!asset) {
            return res.status(404).json({ code: 404, message: '资产不存在' });
        }


        res.json({
            code: 200,
            message: 'success',
            data: asset
        });
    } catch (error) {
        next(error);
    }
};

const createAsset = async (req, res, next) => {
    try {
        const {
            name, serial_number, type_id, brand, model, spec,
            purchase_date, purchase_price, supplier, invoice_number,
            warranty_end_date, location, department_id, responsible_id,
            photos, remarks, purchase_application_id
        } = req.body;

        if (serial_number) {
            const existing = await Asset.findOne({ where: { serial_number } });
            if (existing) {
                return res.status(400).json({ code: 400, message: '资产序列号已存在' });
            }
        }

        if (req.user.role === 'dept_admin') {
            if (!req.user.department_id) {
                return res.status(403).json({ code: 403, message: '您尚未分配部门，请联系管理员' });
            }
            if (department_id && department_id !== req.user.department_id) {
                return res.status(403).json({ code: 403, message: '权限不足，只能创建本部门资产' });
            }
        }

        const asset_code = generateAssetCode();

        const net_value = purchase_price || 0;

        const qrCode = await generateAssetQRCode(0, asset_code);

        const assetStatus = req.user.role === 'normal_user' ? 'pending' : 'idle';

        const asset = await Asset.create({
            asset_code,
            serial_number,
            name,
            type_id,
            brand,
            model,
            spec,
            purchase_date,
            purchase_price,
            net_value,
            supplier,
            invoice_number,
            warranty_end_date,
            location,
            department_id,
            responsible_id,
            qr_code: qrCode,
            photos,
            remarks,
            purchase_application_id,
            status: assetStatus,
            created_by: req.user.id
        });

        asset.qr_code = await generateAssetQRCode(asset.id, asset.asset_code);
        await asset.save();

        await logAction({
            user: { id: req.user.id, real_name: req.user.real_name, username: req.user.username },
            ip: req.ip,
            module: '资产管理',
            action: 'create',
            actionName: '创建资产',
            entityType: 'Asset',
            entityId: asset.id,
            beforeData: null,
            afterData: { asset_code, name, serial_number },
            result: 'success',
            userAgent: req.get('user-agent')
        });

        res.status(201).json({
            code: 201,
            message: '资产创建成功',
            data: asset
        });
    } catch (error) {
        next(error);
    }
};

const updateAsset = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const asset = await Asset.findByPk(id);
        if (!asset) {
            return res.status(404).json({ code: 404, message: '资产不存在' });
        }

        if (req.user.role === 'dept_admin') {
            if (!req.user.department_id) {
                return res.status(403).json({ code: 403, message: '您尚未分配部门，请联系管理员' });
            }
            if (asset.department_id !== req.user.department_id) {
                return res.status(403).json({ code: 403, message: '权限不足' });
            }
        }

        if (req.user.role === 'normal_user') {
            return res.status(403).json({ code: 403, message: '权限不足' });
        }

        if (updates.serial_number && updates.serial_number !== asset.serial_number) {
            const existing = await Asset.findOne({ where: { serial_number: updates.serial_number } });
            if (existing) {
                return res.status(400).json({ code: 400, message: '资产序列号已存在' });
            }
        }

        if (['scrapped'].includes(asset.status)) {
            return res.status(400).json({ code: 400, message: '已报废资产不能修改' });
        }

        const beforeData = asset.toJSON();

        await asset.update(updates);

        await logAction({
            user: { id: req.user.id, real_name: req.user.real_name, username: req.user.username },
            ip: req.ip,
            module: '资产管理',
            action: 'update',
            actionName: '更新资产',
            entityType: 'Asset',
            entityId: asset.id,
            beforeData,
            afterData: asset.toJSON(),
            result: 'success',
            userAgent: req.get('user-agent')
        });

        res.json({
            code: 200,
            message: '资产更新成功',
            data: asset
        });
    } catch (error) {
        next(error);
    }
};

const deleteAsset = async (req, res, next) => {
    try {
        const { id } = req.params;

        const asset = await Asset.findByPk(id);
        if (!asset) {
            return res.status(404).json({ code: 404, message: '资产不存在' });
        }

        if (req.user.role === 'dept_admin') {
            if (!req.user.department_id) {
                return res.status(403).json({ code: 403, message: '您尚未分配部门，请联系管理员' });
            }
            if (asset.department_id !== req.user.department_id) {
                return res.status(403).json({ code: 403, message: '权限不足，只能删除本部门资产' });
            }
        }

        // 普通用户无权删除资产
        if (req.user.role === 'normal_user') {
            return res.status(403).json({ code: 403, message: '权限不足，普通用户无法删除资产' });
        }

        if (!['idle', 'scrapped', 'pending_delete'].includes(asset.status)) {
            return res.status(400).json({ code: 400, message: '只有空闲或已报废状态的资产可以删除' });
        }

        const beforeData = asset.toJSON();
        await asset.destroy();

        await logAction({
            user: { id: req.user.id, real_name: req.user.real_name, username: req.user.username },
            ip: req.ip,
            module: '资产管理',
            action: 'delete',
            actionName: '删除资产',
            entityType: 'Asset',
            entityId: parseInt(id),
            beforeData,
            afterData: null,
            result: 'success',
            userAgent: req.get('user-agent')
        });

        await sendSensitiveOperationNotification(
            req.user,
            '删除资产',
            `删除了资产 ${beforeData.asset_code} - ${beforeData.name}`,
            '资产管理'
        );

        res.json({
            code: 200,
            message: '资产删除成功',
            data: null
        });
    } catch (error) {
        next(error);
    }
};

const getAssetQRCode = async (req, res, next) => {
    try {
        const { id } = req.params;

        const asset = await Asset.findByPk(id);
        if (!asset) {
            return res.status(404).json({ code: 404, message: '资产不存在' });
        }

        const qrCode = asset.qr_code || await generateAssetQRCode(asset.id, asset.asset_code);

        res.json({
            code: 200,
            message: 'success',
            data: { qrCode }
        });
    } catch (error) {
        next(error);
    }
};

const getAssetTypes = async (req, res, next) => {
    try {
        const types = await AssetType.findAll({
            order: [['id', 'ASC']]
        });

        res.json({
            code: 200,
            message: 'success',
            data: types
        });
    } catch (error) {
        next(error);
    }
};

const createAssetType = async (req, res, next) => {
    try {
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ code: 403, message: '权限不足' });
        }

        const { name, code, parent_id, depreciation_years } = req.body;

        const type = await AssetType.create({
            name,
            code,
            parent_id,
            depreciation_years: depreciation_years || 5
        });

        await logAction({
            user: { id: req.user.id, real_name: req.user.real_name, username: req.user.username },
            ip: req.ip,
            module: '资产管理',
            action: 'createType',
            actionName: '创建资产类型',
            entityType: 'AssetType',
            entityId: type.id,
            beforeData: null,
            afterData: { name, code },
            result: 'success',
            userAgent: req.get('user-agent')
        });

        res.status(201).json({
            code: 201,
            message: '资产类型创建成功',
            data: type
        });
    } catch (error) {
        next(error);
    }
};

const deleteAssetType = async (req, res, next) => {
    try {
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ code: 403, message: '权限不足' });
        }

        const { id } = req.params;

        const type = await AssetType.findByPk(id);
        if (!type) {
            return res.status(404).json({ code: 404, message: '资产类型不存在' });
        }

        const assetCount = await Asset.count({ where: { type_id: id } });
        if (assetCount > 0) {
            return res.status(400).json({ 
                code: 400, 
                message: `该类型下有 ${assetCount} 个资产，无法删除` 
            });
        }

        const beforeData = type.toJSON();
        await type.destroy();

        await logAction({
            user: { id: req.user.id, real_name: req.user.real_name, username: req.user.username },
            ip: req.ip,
            module: '资产管理',
            action: 'deleteType',
            actionName: '删除资产类型',
            entityType: 'AssetType',
            entityId: parseInt(id),
            beforeData,
            afterData: null,
            result: 'success',
            userAgent: req.get('user-agent')
        });

        res.json({
            code: 200,
            message: '资产类型删除成功',
            data: null
        });
    } catch (error) {
        next(error);
    }
};

const getAssetLoans = async (req, res, next) => {
    try {
        const { page = 1, pageSize = 10, status } = req.query;
        const offset = (page - 1) * pageSize;
        const where = {};

        if (status) where.status = status;

        const { count, rows } = await AssetLoan.findAndCountAll({
            where,
            include: [
                { model: Asset, as: 'asset', attributes: ['id', 'asset_code', 'name', 'serial_number'] },
                { model: User, as: 'user', attributes: ['id', 'real_name', 'username'] }
            ],
            offset: parseInt(offset),
            limit: parseInt(pageSize),
            order: [['created_at', 'DESC']]
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

const createLoan = async (req, res, next) => {
    try {
        const { asset_id, expected_return_date, purpose } = req.body;

        const asset = await Asset.findByPk(asset_id);
        if (!asset) {
            return res.status(404).json({ code: 404, message: '资产不存在' });
        }

        if (asset.status !== 'idle') {
            return res.status(400).json({ code: 400, message: '该资产当前不可用' });
        }

        const isSuperAdmin = req.user.role === 'super_admin';

        const loan = await AssetLoan.create({
            asset_id,
            user_id: req.user.id,
            department_id: req.user.department_id,
            expected_return_date,
            purpose,
            status: isSuperAdmin ? 'approved' : 'pending',
            loan_date: isSuperAdmin ? new Date() : null,
            loan_method: isSuperAdmin ? 'manual' : null,
            loan_operator_id: isSuperAdmin ? req.user.id : null
        });

        if (isSuperAdmin) {
            await asset.update({ status: 'in_use' });
        }

        await logAction({
            user: { id: req.user.id, real_name: req.user.real_name, username: req.user.username },
            ip: req.ip,
            module: '资产领用',
            action: isSuperAdmin ? 'directLoan' : 'create',
            actionName: isSuperAdmin ? '超级管理员直接领用' : '发起领用申请',
            entityType: 'AssetLoan',
            entityId: loan.id,
            beforeData: null,
            afterData: { asset_id, status: isSuperAdmin ? 'approved' : 'pending' },
            result: 'success',
            userAgent: req.get('user-agent')
        });

        res.status(201).json({
            code: 201,
            message: isSuperAdmin ? '领用成功' : '领用申请已提交',
            data: loan
        });
    } catch (error) {
        next(error);
    }
};

const approveLoan = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { action, remark } = req.body;

        if (req.user.role !== 'dept_admin' && req.user.role !== 'super_admin') {
            return res.status(403).json({ code: 403, message: '权限不足' });
        }

        const loan = await AssetLoan.findByPk(id, {
            include: [{ model: Asset, as: 'asset' }]
        });

        if (!loan) {
            return res.status(404).json({ code: 404, message: '领用记录不存在' });
        }

        if (loan.status !== 'pending') {
            return res.status(400).json({ code: 400, message: '该申请已处理' });
        }

        if (action === 'approve') {
            loan.status = 'approved';
            loan.loan_date = new Date();
            loan.loan_method = 'manual';
            loan.loan_operator_id = req.user.id;

            const asset = await Asset.findByPk(loan.asset_id);
            if (asset) {
                asset.status = 'in_use';
                await asset.save();
            }
        } else if (action === 'reject') {
            loan.status = 'cancelled';
        }

        await loan.save();

        await logAction({
            user: { id: req.user.id, real_name: req.user.real_name, username: req.user.username },
            ip: req.ip,
            module: '资产领用',
            action: action === 'approve' ? 'approve' : 'reject',
            actionName: action === 'approve' ? '审批通过' : '审批驳回',
            entityType: 'AssetLoan',
            entityId: loan.id,
            result: 'success',
            userAgent: req.get('user-agent')
        });

        res.json({
            code: 200,
            message: action === 'approve' ? '审批通过' : '已驳回',
            data: loan
        });
    } catch (error) {
        next(error);
    }
};

const withdrawLoan = async (req, res, next) => {
    try {
        const { id } = req.params;

        const loan = await AssetLoan.findByPk(id);

        if (!loan) {
            return res.status(404).json({ code: 404, message: '领用记录不存在' });
        }

        if (loan.user_id !== req.user.id) {
            return res.status(403).json({ code: 403, message: '只能撤回自己的申请' });
        }

        if (loan.status !== 'pending') {
            return res.status(400).json({ code: 400, message: '只能撤回待审批的申请' });
        }

        await loan.update({ status: 'cancelled' });

        await logAction({
            user: { id: req.user.id, real_name: req.user.real_name, username: req.user.username },
            ip: req.ip,
            module: '资产领用',
            action: 'withdraw',
            actionName: '撤回领用申请',
            entityType: 'AssetLoan',
            entityId: loan.id,
            result: 'success',
            userAgent: req.get('user-agent')
        });

        res.json({ code: 200, message: '申请已撤回', data: loan });
    } catch (error) {
        next(error);
    }
};

const batchApproveLoans = async (req, res, next) => {
    try {
        const { ids, action } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ code: 400, message: '请选择要审批的申请' });
        }

        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({ code: 400, message: '无效的操作类型' });
        }

        if (req.user.role !== 'dept_admin' && req.user.role !== 'super_admin') {
            return res.status(403).json({ code: 403, message: '权限不足' });
        }

        const loans = await AssetLoan.findAll({
            where: { id: ids, status: 'pending' },
            include: [{ model: Asset, as: 'asset' }]
        });

        if (loans.length === 0) {
            return res.status(400).json({ code: 400, message: '没有符合条件的申请可审批' });
        }

        const newStatus = action === 'approve' ? 'approved' : 'cancelled';

        for (const loan of loans) {
            loan.status = newStatus;
            if (action === 'approve') {
                loan.loan_date = new Date();
                loan.loan_method = 'manual';
                loan.loan_operator_id = req.user.id;

                if (loan.asset) {
                    loan.asset.status = 'in_use';
                    await loan.asset.save();
                }
            }
            await loan.save();

            await logAction({
                user: { id: req.user.id, real_name: req.user.real_name, username: req.user.username },
                ip: req.ip,
                module: '资产领用',
                action: 'batchApprove',
                actionName: `批量${action === 'approve' ? '通过' : '驳回'}`,
                entityType: 'AssetLoan',
                entityId: loan.id,
                result: 'success',
                userAgent: req.get('user-agent')
            });
        }

        res.json({ 
            code: 200, 
            message: `已${action === 'approve' ? '通过' : '驳回'} ${loans.length} 条申请`, 
            data: { count: loans.length } 
        });
    } catch (error) {
        next(error);
    }
};

const scanConfirmLoan = async (req, res, next) => {
    try {
        const { asset_id } = req.body;

        const loan = await AssetLoan.findOne({
            where: { asset_id, status: 'approved' },
            order: [['created_at', 'DESC']]
        });

        if (!loan) {
            return res.status(404).json({ code: 404, message: '没有待确认的领用记录' });
        }

        const asset = await Asset.findByPk(asset_id);
        if (asset) {
            asset.status = 'in_use';
            await asset.save();
        }

        await logAction({
            user: { id: req.user.id, real_name: req.user.real_name, username: req.user.username },
            ip: req.ip,
            module: '资产领用',
            action: 'scanConfirm',
            actionName: '扫码确认领用',
            entityType: 'AssetLoan',
            entityId: loan.id,
            result: 'success',
            userAgent: req.get('user-agent')
        });

        res.json({
            code: 200,
            message: '领用确认成功',
            data: loan
        });
    } catch (error) {
        next(error);
    }
};

const scanReturnAsset = async (req, res, next) => {
    try {
        const { asset_id } = req.body;

        const loan = await AssetLoan.findOne({
            where: { asset_id, status: { [Op.in]: ['approved', 'overdue'] } },
            order: [['created_at', 'DESC']]
        });

        if (!loan) {
            return res.status(404).json({ code: 404, message: '没有待归还的领用记录' });
        }

        loan.status = 'returned';
        loan.actual_return_date = new Date();
        loan.return_method = 'scan';
        loan.return_operator_id = req.user.id;
        await loan.save();

        const asset = await Asset.findByPk(asset_id);
        if (asset) {
            asset.status = 'idle';
            await asset.save();
        }

        await logAction({
            user: { id: req.user.id, real_name: req.user.real_name, username: req.user.username },
            ip: req.ip,
            module: '资产领用',
            action: 'scanReturn',
            actionName: '扫码确认归还',
            entityType: 'AssetLoan',
            entityId: loan.id,
            result: 'success',
            userAgent: req.get('user-agent')
        });

        res.json({
            code: 200,
            message: '归还确认成功',
            data: loan
        });
    } catch (error) {
        next(error);
    }
};

const importAssets = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ code: 400, message: '请上传文件' });
        }

        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ code: 403, message: '权限不足，只有超级管理员可以导入资产' });
        }

        const XLSX = require('xlsx');
        const fs = require('fs');
        
        const workbook = XLSX.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });

        if (data.length === 0) {
            return res.status(400).json({ code: 400, message: '导入文件为空或格式不正确' });
        }

        const fieldMapping = {
            '资产名称': 'name',
            '设备类型': 'type_name',
            '设备类型代码': 'type_code',
            '品牌': 'brand',
            '型号': 'model',
            '规格': 'spec',
            '序列号': 'serial_number',
            '购置日期': 'purchase_date',
            '购置价格': 'purchase_price',
            '资产价值': 'purchase_price',
            '供应商': 'supplier',
            '发票号': 'invoice_number',
            '保修截止日期': 'warranty_end_date',
            '保修期限': 'warranty_end_date',
            '存放位置': 'location',
            '部门代码': 'department_code',
            '负责人': 'responsible_name',
            '备注': 'remarks',
            '上次检修日期': 'last_repair_date',
            '使用状态': 'status',
            '状态': 'status',
            'name': 'name',
            'type_name': 'type_name',
            'type_code': 'type_code',
            'brand': 'brand',
            'model': 'model',
            'spec': 'spec',
            'serial_number': 'serial_number',
            'purchase_date': 'purchase_date',
            'purchase_price': 'purchase_price',
            'supplier': 'supplier',
            'invoice_number': 'invoice_number',
            'warranty_end_date': 'warranty_end_date',
            'location': 'location',
            'department_code': 'department_code',
            'responsible_name': 'responsible_name',
            'remarks': 'remarks',
            'last_repair_date': 'last_repair_date'
        };

        const cleanDate = (val) => (val && typeof val === 'string' && val.trim() !== '') ? val.trim() : (val && val !== '' ? String(val) : null);
        const cleanStr = (val) => (val && typeof val === 'string' && val.trim() !== '') ? val.trim() : (val && typeof val !== 'string' ? String(val) : null);

        const statusMap = {
            '正常': 'idle',
            '空闲': 'idle',
            '在用': 'in_use',
            '使用中': 'in_use',
            '维修中': 'repairing',
            '维修': 'repairing',
            '报废': 'scrapped',
            '已报废': 'scrapped',
            'idle': 'idle',
            'in_use': 'in_use',
            'repairing': 'repairing',
            'scrapped': 'scrapped'
        };
        const cleanStatus = (val) => {
            if (!val) return 'idle';
            const status = statusMap[val.trim()] || statusMap[val] || 'idle';
            return status;
        };

        const convertRow = (row) => {
            const converted = {};
            for (const key in row) {
                const mappedKey = fieldMapping[key] || key;
                converted[mappedKey] = row[key];
            }
            if (!converted.name && converted.type_name) {
                converted.name = converted.type_name;
            }
            return converted;
        };

        // 预加载所有数据到内存缓存
        const allTypes = await AssetType.findAll();
        const typeByName = new Map(allTypes.map(t => [t.name, t]));
        const typeByCode = new Map(allTypes.map(t => [t.code, t]));

        const allDepts = await Department.findAll();
        const deptByCode = new Map(allDepts.map(d => [d.code, d]));
        const defaultDeptId = allDepts.length > 0 ? allDepts[0].id : null;

        const allUsers = await User.findAll();
        const userByName = new Map(allUsers.map(u => [u.real_name, u]));

        const existingAssets = await Asset.findAll({ attributes: ['serial_number'] });
        const usedSerials = new Set(existingAssets.map(a => a.serial_number).filter(Boolean));

        let successCount = 0;
        let errorCount = 0;
        const errors = [];
        const recordsToCreate = [];
        const timestamp = Date.now();

        // 第一遍：转换数据并收集需要新建的类型
        for (let i = 0; i < data.length; i++) {
            const row = convertRow(data[i]);

            if (!row.name) {
                errorCount++;
                errors.push(`第${i + 2}行: 缺少资产名称`);
                continue;
            }

            let type_id = null;
            let department_id = defaultDeptId;
            let responsible_id = null;

            if (row.type_code && typeByCode.has(row.type_code)) {
                type_id = typeByCode.get(row.type_code).id;
            }
            if (!type_id && row.type_name && typeByName.has(row.type_name)) {
                type_id = typeByName.get(row.type_name).id;
            }
            if (!type_id && row.type_name) {
                const newCode = 'IMP' + String(allTypes.length + 1).padStart(3, '0');
                const newType = await AssetType.create({ name: row.type_name, code: newCode, description: '导入时自动创建' });
                allTypes.push(newType);
                typeByName.set(newType.name, newType);
                typeByCode.set(newType.code, newType);
                type_id = newType.id;
            }

            if (row.department_code && deptByCode.has(row.department_code)) {
                department_id = deptByCode.get(row.department_code).id;
            }

            if (row.responsible_name && row.responsible_name !== '未指定' && userByName.has(row.responsible_name)) {
                responsible_id = userByName.get(row.responsible_name).id;
            }

            let serial_number = cleanStr(row.serial_number);
            if (serial_number) {
                if (usedSerials.has(serial_number)) {
                    serial_number = serial_number + '_' + timestamp + '_' + i;
                }
                usedSerials.add(serial_number);
            }

            const purchase_price = parseFloat(row.purchase_price) || 0;

            const finalStatus = cleanStatus(row.status);
            if (i < 5 && row.status) {
                console.log(`第${i + 2}行状态: 原始值="${row.status}", 转换后="${finalStatus}"`);
            }

            recordsToCreate.push({
                index: i,
                asset_code: generateAssetCode(),
                serial_number,
                name: row.name,
                type_id,
                brand: cleanStr(row.brand),
                model: cleanStr(row.model),
                spec: cleanStr(row.spec),
                purchase_date: cleanDate(row.purchase_date),
                purchase_price,
                net_value: purchase_price,
                supplier: cleanStr(row.supplier),
                invoice_number: cleanStr(row.invoice_number),
                warranty_end_date: cleanDate(row.warranty_end_date),
                location: cleanStr(row.location),
                department_id,
                responsible_id,
                status: finalStatus,
                remarks: cleanStr(row.remarks),
                last_repair_date: cleanDate(row.last_repair_date),
                created_by: req.user.id
            });
        }

        // 第二遍：批量插入
        for (const record of recordsToCreate) {
            try {
                await Asset.create(record);
                successCount++;
            } catch (err) {
                errorCount++;
                const errMsg = err.message || '未知错误';
                errors.push(`第${record.index + 2}行: ${errMsg}`);
                if (errors.length <= 3) {
                    console.error(`导入第${record.index + 2}行失败:`, errMsg);
                }
            }
        }

        // 清理上传文件
        try { fs.unlinkSync(req.file.path); } catch(e) {}

        await logAction({
            user: { id: req.user.id, real_name: req.user.real_name, username: req.user.username },
            ip: req.ip,
            module: '资产管理',
            action: 'import',
            actionName: '批量导入资产',
            entityType: 'Asset',
            entityId: null,
            beforeData: null,
            afterData: { total: data.length, success: successCount, failed: errorCount },
            result: 'success',
            userAgent: req.get('user-agent')
        });

        res.json({
            code: 200,
            message: `导入完成，成功 ${successCount} 条，失败 ${errorCount} 条`,
            data: { count: successCount, errors: errors.slice(0, 20) }
        });
    } catch (error) {
        next(error);
    }
};

const deleteAllAssets = async (req, res, next) => {
    try {
        const count = await Asset.destroy({ where: {}, truncate: false });
        await logAction({
            user: { id: req.user.id, real_name: req.user.real_name, username: req.user.username },
            ip: req.ip,
            module: '资产管理',
            action: 'delete_all',
            actionName: '清空全部资产',
            entityType: 'Asset',
            entityId: null,
            beforeData: null,
            afterData: { deletedCount: count },
            result: 'success',
            userAgent: req.get('user-agent')
        });
        res.json({ code: 200, message: `已删除全部 ${count} 条资产`, data: { count } });
    } catch (error) {
        next(error);
    }
};

const approveAsset = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (req.user.role !== 'super_admin' && req.user.role !== 'dept_admin') {
            return res.status(403).json({ code: 403, message: '权限不足，只有管理员可以审核资产' });
        }

        const asset = await Asset.findByPk(id);
        if (!asset) {
            return res.status(404).json({ code: 404, message: '资产不存在' });
        }

        if (req.user.role === 'dept_admin') {
            if (!req.user.department_id) {
                return res.status(403).json({ code: 403, message: '您尚未分配部门，请联系管理员' });
            }
            if (asset.department_id !== req.user.department_id) {
                return res.status(403).json({ code: 403, message: '只能审核本部门的资产' });
            }
        }

        if (asset.status !== 'pending') {
            return res.status(400).json({ code: 400, message: '该资产不在待审核状态' });
        }

        const beforeData = asset.toJSON();
        asset.status = 'idle';
        await asset.save();

        await logAction({
            user: { id: req.user.id, real_name: req.user.real_name, username: req.user.username },
            ip: req.ip,
            module: '资产管理',
            action: 'approve',
            actionName: '审核通过资产',
            entityType: 'Asset',
            entityId: asset.id,
            beforeData,
            afterData: asset.toJSON(),
            result: 'success',
            userAgent: req.get('user-agent')
        });

        res.json({ code: 200, message: '资产审核通过', data: asset });
    } catch (error) {
        next(error);
    }
};

const rejectAsset = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (req.user.role !== 'super_admin' && req.user.role !== 'dept_admin') {
            return res.status(403).json({ code: 403, message: '权限不足，只有管理员可以驳回资产' });
        }

        const asset = await Asset.findByPk(id);
        if (!asset) {
            return res.status(404).json({ code: 404, message: '资产不存在' });
        }

        if (req.user.role === 'dept_admin') {
            if (!req.user.department_id) {
                return res.status(403).json({ code: 403, message: '您尚未分配部门，请联系管理员' });
            }
            if (asset.department_id !== req.user.department_id) {
                return res.status(403).json({ code: 403, message: '只能驳回本部门的资产' });
            }
        }

        if (asset.status !== 'pending') {
            return res.status(400).json({ code: 400, message: '该资产不在待审核状态' });
        }

        const beforeData = asset.toJSON();
        const originalCreatorId = asset.created_by;
        if (!originalCreatorId) {
            return res.status(400).json({ code: 400, message: '无法确定资产创建者，驳回失败' });
        }
        const reason = req.body.reason || '未提供驳回原因';

        await AssetRejection.create({
            user_id: originalCreatorId,
            asset_id: null,
            asset_code: asset.asset_code,
            asset_name: asset.name,
            rejection_type: 'create',
            reason: reason,
            rejected_by: req.user.id,
            rejected_at: new Date(),
            is_read: false,
            original_data: JSON.stringify({
                name: asset.name,
                serial_number: asset.serial_number,
                type_id: asset.type_id,
                brand: asset.brand,
                model: asset.model,
                spec: asset.spec,
                purchase_date: asset.purchase_date,
                purchase_price: asset.purchase_price,
                supplier: asset.supplier,
                invoice_number: asset.invoice_number,
                warranty_end_date: asset.warranty_end_date,
                location: asset.location,
                department_id: asset.department_id,
                responsible_id: asset.responsible_id,
                remarks: asset.remarks
            })
        });

        await asset.destroy();

        await logAction({
            user: { id: req.user.id, real_name: req.user.real_name, username: req.user.username },
            ip: req.ip,
            module: '资产管理',
            action: 'reject',
            actionName: '驳回资产',
            entityType: 'Asset',
            entityId: parseInt(id),
            beforeData,
            afterData: null,
            result: 'success',
            userAgent: req.get('user-agent')
        });

        res.json({ code: 200, message: '资产已驳回并删除', data: null });
    } catch (error) {
        next(error);
    }
};

const confirmDeleteAsset = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (req.user.role !== 'super_admin' && req.user.role !== 'dept_admin') {
            return res.status(403).json({ code: 403, message: '权限不足，只有管理员可以审核删除' });
        }

        const asset = await Asset.findByPk(id);
        if (!asset) {
            return res.status(404).json({ code: 404, message: '资产不存在' });
        }

        if (req.user.role === 'dept_admin') {
            if (!req.user.department_id) {
                return res.status(403).json({ code: 403, message: '您尚未分配部门，请联系管理员' });
            }
            if (asset.department_id !== req.user.department_id) {
                return res.status(403).json({ code: 403, message: '只能确认删除本部门的资产' });
            }
        }

        if (asset.status !== 'pending_delete') {
            return res.status(400).json({ code: 400, message: '该资产不在待删除审核状态' });
        }

        const beforeData = asset.toJSON();
        await asset.destroy();

        await logAction({
            user: { id: req.user.id, real_name: req.user.real_name, username: req.user.username },
            ip: req.ip,
            module: '资产管理',
            action: 'confirm_delete',
            actionName: '确认删除资产',
            entityType: 'Asset',
            entityId: parseInt(id),
            beforeData,
            afterData: null,
            result: 'success',
            userAgent: req.get('user-agent')
        });

        await sendSensitiveOperationNotification(
            req.user,
            '确认删除资产',
            `确认删除了资产 ${beforeData.asset_code} - ${beforeData.name}`,
            '资产管理'
        );

        res.json({ code: 200, message: '资产已删除', data: null });
    } catch (error) {
        next(error);
    }
};

const rejectDeleteAsset = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (req.user.role !== 'super_admin' && req.user.role !== 'dept_admin') {
            return res.status(403).json({ code: 403, message: '权限不足，只有管理员可以驳回删除申请' });
        }

        const asset = await Asset.findByPk(id);
        if (!asset) {
            return res.status(404).json({ code: 404, message: '资产不存在' });
        }

        if (req.user.role === 'dept_admin') {
            if (!req.user.department_id) {
                return res.status(403).json({ code: 403, message: '您尚未分配部门，请联系管理员' });
            }
            if (asset.department_id !== req.user.department_id) {
                return res.status(403).json({ code: 403, message: '只能驳回本部门资产的删除申请' });
            }
        }

        if (asset.status !== 'pending_delete') {
            return res.status(400).json({ code: 400, message: '该资产不在待删除审核状态' });
        }

        const beforeData = asset.toJSON();
        const deleteRequesterId = asset.delete_requested_by || asset.created_by;
        if (!deleteRequesterId) {
            return res.status(400).json({ code: 400, message: '无法确定删除申请人，驳回失败' });
        }
        const reason = req.body.reason || '未提供驳回原因';

        await AssetRejection.create({
            user_id: deleteRequesterId,
            asset_id: asset.id,
            asset_code: asset.asset_code,
            asset_name: asset.name,
            rejection_type: 'delete',
            reason: reason,
            rejected_by: req.user.id,
            rejected_at: new Date(),
            is_read: false,
            original_data: null
        });

        asset.status = 'idle';
        asset.delete_requested_by = null;
        await asset.save();

        await logAction({
            user: { id: req.user.id, real_name: req.user.real_name, username: req.user.username },
            ip: req.ip,
            module: '资产管理',
            action: 'reject_delete',
            actionName: '驳回删除申请',
            entityType: 'Asset',
            entityId: asset.id,
            beforeData,
            afterData: asset.toJSON(),
            result: 'success',
            userAgent: req.get('user-agent')
        });

        res.json({ code: 200, message: '已驳回删除申请，资产已恢复', data: asset });
    } catch (error) {
        next(error);
    }
};

const getLocations = async (req, res, next) => {
    try {
        const locations = await Asset.findAll({
            attributes: ['location'],
            where: { location: { [Op.ne]: null, [Op.ne]: '' } },
            group: ['location'],
            order: [['location', 'ASC']],
            raw: true
        });
        const locationList = locations.map(l => l.location).filter(Boolean);
        res.json({ code: 200, message: 'success', data: locationList });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAssets,
    getAssetById,
    createAsset,
    updateAsset,
    deleteAsset,
    deleteAllAssets,
    approveAsset,
    rejectAsset,
    confirmDeleteAsset,
    rejectDeleteAsset,
    getAssetQRCode,
    getAssetTypes,
    getLocations,
    createAssetType,
    deleteAssetType,
    importAssets,
    getAssetLoans,
    createLoan,
    approveLoan,
    withdrawLoan,
    batchApproveLoans,
    scanConfirmLoan,
    scanReturnAsset
};
