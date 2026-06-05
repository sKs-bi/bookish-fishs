const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: '操作人ID'
    },
    user_name: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: '操作人姓名'
    },
    user_code: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: '操作人工号/学号'
    },
    ip_address: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'IP地址'
    },
    module: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: '操作模块'
    },
    action: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: '操作类型'
    },
    action_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: '操作名称'
    },
    entity_type: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: '操作对象类型'
    },
    entity_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '操作对象ID'
    },
    before_data: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: '操作前数据快照'
    },
    after_data: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: '操作后数据快照'
    },
    result: {
        type: DataTypes.ENUM('success', 'failed'),
        defaultValue: 'success',
        comment: '操作结果'
    },
    error_message: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '错误信息'
    },
    user_agent: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: '浏览器信息'
    },
    operate_time: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        comment: '操作时间'
    }
}, {
    tableName: 'audit_logs',
    comment: '审计日志表',
    timestamps: false
});

module.exports = AuditLog;
