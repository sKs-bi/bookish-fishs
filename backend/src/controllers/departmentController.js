const { Department, User } = require('../models');
const { Op } = require('sequelize');
const { logAction } = require('../middleware/audit');

const getDepartmentTree = async (req, res, next) => {
    try {
        const departments = await Department.findAll({
            where: { status: 'active' },
            order: [['level', 'ASC'], ['id', 'ASC']]
        });

        const tree = buildTree(departments);

        res.json({
            code: 200,
            message: 'success',
            data: tree
        });
    } catch (error) {
        next(error);
    }
};

const buildTree = (departments, parentId = null) => {
    return departments
        .filter(d => d.parent_id === parentId)
        .map(d => ({
            ...d.toJSON(),
            children: buildTree(departments, d.id)
        }));
};

const getDepartments = async (req, res, next) => {
    try {
        const { keyword, status } = req.query;
        const where = {};

        if (keyword) {
            where[Op.or] = [
                { name: { [Op.like]: `%${keyword}%` } },
                { code: { [Op.like]: `%${keyword}%` } }
            ];
        }

        if (status) where.status = status;

        const departments = await Department.findAll({
            where,
            order: [['level', 'ASC'], ['id', 'ASC']]
        });

        res.json({
            code: 200,
            message: 'success',
            data: departments
        });
    } catch (error) {
        next(error);
    }
};

const getDepartmentById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const department = await Department.findByPk(id);

        if (!department) {
            return res.status(404).json({ code: 404, message: '部门不存在' });
        }

        res.json({
            code: 200,
            message: 'success',
            data: department
        });
    } catch (error) {
        next(error);
    }
};

const createDepartment = async (req, res, next) => {
    try {
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ code: 403, message: '权限不足' });
        }

        const { name, code, parent_id, manager_id } = req.body;

        let level = 1;
        let path = '';

        if (parent_id) {
            const parent = await Department.findByPk(parent_id);
            if (!parent) {
                return res.status(400).json({ code: 400, message: '上级部门不存在' });
            }
            level = parent.level + 1;
            path = parent.path;
        }

        const department = await Department.create({
            name,
            code,
            parent_id,
            level,
            path: path ? `${path},${parent_id}` : String(parent_id || ''),
            manager_id,
            status: 'active'
        });

        await logAction({
            user: { id: req.user.id, real_name: req.user.real_name, username: req.user.username },
            ip: req.ip,
            module: '部门管理',
            action: 'create',
            actionName: '创建部门',
            entityType: 'Department',
            entityId: department.id,
            beforeData: null,
            afterData: { name, code, level },
            result: 'success',
            userAgent: req.get('user-agent')
        });

        res.status(201).json({
            code: 201,
            message: '部门创建成功',
            data: department
        });
    } catch (error) {
        next(error);
    }
};

const updateDepartment = async (req, res, next) => {
    try {
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ code: 403, message: '权限不足' });
        }

        const { id } = req.params;
        const { name, code, parent_id, manager_id, status } = req.body;

        const department = await Department.findByPk(id);
        if (!department) {
            return res.status(404).json({ code: 404, message: '部门不存在' });
        }

        if (parent_id && parent_id !== department.parent_id) {
            const parent = await Department.findByPk(parent_id);
            if (!parent) {
                return res.status(400).json({ code: 400, message: '上级部门不存在' });
            }
            if (parent_id === id) {
                return res.status(400).json({ code: 400, message: '不能将自己设为上级部门' });
            }
        }

        const beforeData = department.toJSON();

        await department.update({
            name,
            code,
            parent_id,
            manager_id,
            status
        });

        if (parent_id !== department.parent_id && parent_id) {
            const parent = await Department.findByPk(parent_id);
            department.level = parent.level + 1;
            department.path = `${parent.path},${parent_id}`;
            await department.save();
        }

        await logAction({
            user: { id: req.user.id, real_name: req.user.real_name, username: req.user.username },
            ip: req.ip,
            module: '部门管理',
            action: 'update',
            actionName: '更新部门',
            entityType: 'Department',
            entityId: department.id,
            beforeData,
            afterData: department.toJSON(),
            result: 'success',
            userAgent: req.get('user-agent')
        });

        res.json({
            code: 200,
            message: '部门更新成功',
            data: department
        });
    } catch (error) {
        next(error);
    }
};

const deleteDepartment = async (req, res, next) => {
    try {
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ code: 403, message: '权限不足' });
        }

        const { id } = req.params;

        const department = await Department.findByPk(id);
        if (!department) {
            return res.status(404).json({ code: 404, message: '部门不存在' });
        }

        const hasChildren = await Department.findOne({ where: { parent_id: id } });
        if (hasChildren) {
            return res.status(400).json({ code: 400, message: '该部门有下级部门，无法删除' });
        }

        const hasUsers = await User.findOne({ where: { department_id: id } });
        if (hasUsers) {
            return res.status(400).json({ code: 400, message: '该部门有用户，无法删除' });
        }

        const beforeData = department.toJSON();
        await department.destroy();

        await logAction({
            user: { id: req.user.id, real_name: req.user.real_name, username: req.user.username },
            ip: req.ip,
            module: '部门管理',
            action: 'delete',
            actionName: '删除部门',
            entityType: 'Department',
            entityId: parseInt(id),
            beforeData,
            afterData: null,
            result: 'success',
            userAgent: req.get('user-agent')
        });

        res.json({
            code: 200,
            message: '部门删除成功',
            data: null
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getDepartmentTree,
    getDepartments,
    getDepartmentById,
    createDepartment,
    updateDepartment,
    deleteDepartment
};
