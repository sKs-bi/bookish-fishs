const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AssetRejection = sequelize.define('AssetRejection', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: '被驳回的用户ID'
    },
    asset_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '资产ID（新增驳回时资产已被删除，所以可能为null）'
    },
    asset_code: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: '资产编号'
    },
    asset_name: {
        type: DataTypes.STRING(200),
        allowNull: true,
        comment: '资产名称'
    },
    rejection_type: {
        type: DataTypes.ENUM('create', 'delete'),
        allowNull: false,
        comment: '驳回类型：create-新增驳回，delete-删除驳回'
    },
    reason: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: '驳回原因'
    },
    rejected_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: '驳回人ID'
    },
    rejected_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: '驳回时间'
    },
    is_read: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: '是否已读'
    },
    read_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '阅读时间'
    },
    original_data: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '原始申请数据JSON，用于重新申请时预填'
    }
}, {
    tableName: 'asset_rejections',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = AssetRejection;
