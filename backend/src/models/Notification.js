const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define('Notification', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    title: {
        type: DataTypes.STRING(200),
        allowNull: false,
        comment: '通知标题'
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '通知内容'
    },
    type: {
        type: DataTypes.ENUM('system', 'approval', 'warning', 'reminder'),
        allowNull: false,
        comment: '通知类型'
    },
    sender_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '发送人ID'
    },
    recipient_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '接收人ID(为空则全体)'
    },
    recipient_role: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: '接收人角色'
    },
    related_module: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: '关联模块'
    },
    related_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '关联ID'
    },
    is_read: {
        type: DataTypes.TINYINT(1),
        defaultValue: 0,
        comment: '是否已读'
    },
    read_time: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '阅读时间'
    }
}, {
    tableName: 'notifications',
    comment: '系统通知表',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = Notification;
