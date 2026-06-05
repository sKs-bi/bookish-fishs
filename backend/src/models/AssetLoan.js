const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AssetLoan = sequelize.define('AssetLoan', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    asset_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: '资产ID'
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: '领用人ID'
    },
    department_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: '领用部门ID'
    },
    loan_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: '领用日期'
    },
    expected_return_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: '预计归还日期'
    },
    actual_return_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: '实际归还日期'
    },
    purpose: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: '领用用途'
    },
    status: {
        type: DataTypes.ENUM('pending', 'approved', 'returned', 'overdue', 'cancelled'),
        defaultValue: 'pending',
        comment: '状态'
    },
    loan_method: {
        type: DataTypes.STRING(20),
        allowNull: true,
        comment: '领用方式: scan扫码/manual手工'
    },
    return_method: {
        type: DataTypes.STRING(20),
        allowNull: true,
        comment: '归还方式: scan扫码/manual手工'
    },
    loan_operator_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '办理领用人ID'
    },
    return_operator_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '办理归还人ID'
    }
}, {
    tableName: 'asset_loans',
    comment: '资产领用表'
});

module.exports = AssetLoan;
