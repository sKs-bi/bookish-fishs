const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BackupRecord = sequelize.define('BackupRecord', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    backup_name: {
        type: DataTypes.STRING(200),
        allowNull: false,
        comment: '备份名称'
    },
    backup_file: {
        type: DataTypes.STRING(500),
        allowNull: false,
        comment: '备份文件路径'
    },
    backup_type: {
        type: DataTypes.ENUM('manual', 'auto'),
        allowNull: false,
        comment: '备份类型'
    },
    backup_size: {
        type: DataTypes.BIGINT,
        allowNull: true,
        comment: '备份文件大小(字节)'
    },
    status: {
        type: DataTypes.ENUM('success', 'failed'),
        allowNull: false,
        comment: '备份状态'
    },
    error_message: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '错误信息'
    },
    backup_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '备份操作人ID'
    }
}, {
    tableName: 'backup_records',
    comment: '数据备份记录表',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = BackupRecord;
