const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AssetScrap = sequelize.define('AssetScrap', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    scrap_code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        comment: '报废单号'
    },
    asset_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: '资产ID'
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
    scrap_reason: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: '报废原因'
    },
    scrap_photos: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: '报废照片JSON'
    },
    original_value: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        comment: '原值'
    },
    net_value: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        comment: '账面净值'
    },
    audit_status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending',
        comment: '审核状态'
    },
    audit_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '审核人ID'
    },
    audit_time: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '审核时间'
    },
    audit_remark: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '审核意见'
    },
    finance_verify_status: {
        type: DataTypes.ENUM('pending', 'verified'),
        defaultValue: 'pending',
        comment: '财务核销状态'
    },
    finance_verify_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '财务核销人ID'
    },
    finance_verify_time: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '财务核销时间'
    },
    status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected', 'verified', 'completed'),
        defaultValue: 'pending',
        comment: '状态'
    }
}, {
    tableName: 'asset_scraps',
    comment: '资产报废表'
});

module.exports = AssetScrap;
