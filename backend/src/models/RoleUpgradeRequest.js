const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RoleUpgradeRequest = sequelize.define('RoleUpgradeRequest', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: '申请人ID'
    },
    current_role: {
        type: DataTypes.ENUM('normal_user', 'dept_admin'),
        allowNull: false,
        comment: '当前角色'
    },
    target_role: {
        type: DataTypes.ENUM('dept_admin', 'super_admin'),
        allowNull: false,
        comment: '目标角色'
    },
    reason: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '申请理由'
    },
    status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending',
        comment: '状态'
    },
    reviewed_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '审批人ID'
    },
    review_comment: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '审批意见'
    },
    reviewed_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '审批时间'
    }
}, {
    tableName: 'role_upgrade_requests',
    comment: '角色升级申请表',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = RoleUpgradeRequest;
