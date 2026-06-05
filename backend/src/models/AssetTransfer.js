const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AssetTransfer = sequelize.define('AssetTransfer', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    transfer_code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        comment: '调拨单号'
    },
    asset_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: '资产ID'
    },
    from_department_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: '调出部门ID'
    },
    to_department_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: '调入部门ID'
    },
    from_responsible_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: '原责任人ID'
    },
    to_responsible_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '新责任人ID'
    },
    transfer_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '调拨原因'
    },
    from_dept_audit_status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending',
        comment: '调出部门审核'
    },
    from_dept_audit_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '调出部门审核人ID'
    },
    from_dept_audit_time: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '调出部门审核时间'
    },
    to_dept_audit_status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending',
        comment: '调入部门审核'
    },
    to_dept_audit_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '调入部门审核人ID'
    },
    to_dept_audit_time: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '调入部门审核时间'
    },
    super_audit_status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending',
        comment: '超级管理员审核'
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
    actual_transfer_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: '实际调拨日期'
    },
    status: {
        type: DataTypes.ENUM('pending', 'from_approved', 'to_approved', 'super_approved', 'completed', 'rejected'),
        defaultValue: 'pending',
        comment: '状态'
    }
}, {
    tableName: 'asset_transfers',
    comment: '资产调拨表'
});

module.exports = AssetTransfer;
