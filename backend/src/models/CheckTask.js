const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CheckTask = sequelize.define('CheckTask', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    task_code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        comment: '任务编号'
    },
    task_name: {
        type: DataTypes.STRING(200),
        allowNull: false,
        comment: '任务名称'
    },
    department_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '盘点部门ID(为空则全量)'
    },
    start_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        comment: '开始日期'
    },
    end_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        comment: '结束日期'
    },
    status: {
        type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'cancelled'),
        defaultValue: 'pending',
        comment: '状态'
    },
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: '创建人ID'
    },
    total_assets: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: '总资产数'
    },
    normal_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: '正常数'
    },
    profit_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: '盘盈数'
    },
    loss_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: '盘亏数'
    },
    checked_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: '已盘点数'
    }
}, {
    tableName: 'check_tasks',
    comment: '盘点任务表'
});

module.exports = CheckTask;
