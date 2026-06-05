const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AssetCheck = sequelize.define('AssetCheck', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    task_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: '盘点任务ID'
    },
    asset_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: '资产ID'
    },
    checker_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: '盘点人ID'
    },
    check_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        comment: '盘点日期'
    },
    check_method: {
        type: DataTypes.ENUM('scan', 'manual'),
        defaultValue: 'scan',
        comment: '盘点方式'
    },
    check_result: {
        type: DataTypes.ENUM('normal', 'profit', 'loss', 'not_found'),
        defaultValue: 'normal',
        comment: '盘点结果'
    },
    actual_location: {
        type: DataTypes.STRING(200),
        allowNull: true,
        comment: '实际位置'
    },
    actual_status: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: '实际状态'
    },
    remarks: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '备注'
    }
}, {
    tableName: 'asset_checks',
    comment: '盘点记录表'
});

module.exports = AssetCheck;
