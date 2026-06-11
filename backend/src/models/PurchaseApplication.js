const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PurchaseApplication = sequelize.define('PurchaseApplication', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    application_code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        comment: '申请单号'
    },
    name: {
        type: DataTypes.STRING(200),
        allowNull: false,
        comment: '资产名称'
    },
    type_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '资产类型ID'
    },
    spec: {
        type: DataTypes.STRING(200),
        allowNull: true,
        comment: '规格参数'
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: '数量'
    },
    estimated_price: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        comment: '预估单价'
    },
    total_price: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        comment: '预估总价'
    },
    purpose: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '用途说明'
    },
    required_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: '需求日期'
    },
    applicant_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: '申请人ID'
    },
    department_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: '申请部门ID'
    },
    dept_audit_status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending',
        comment: '部门审核状态'
    },
    dept_audit_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '部门审核人ID'
    },
    dept_audit_time: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '部门审核时间'
    },
    dept_audit_remark: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '部门审核意见'
    },
    super_audit_status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending',
        comment: '超级管理员审核状态'
    },
    super_audit_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '超级管理员审核人ID'
    },
    super_audit_time: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '超级管理员审核时间'
    },
    super_audit_remark: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '超级管理员审核意见'
    },
    status: {
        type: DataTypes.ENUM('draft', 'dept_pending', 'approved', 'rejected', 'withdrawn'),
        defaultValue: 'draft',
        comment: '状态'
    }
}, {
    tableName: 'purchase_applications',
    comment: '采购申请表'
});

module.exports = PurchaseApplication;
