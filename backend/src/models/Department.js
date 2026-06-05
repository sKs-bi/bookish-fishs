const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Department = sequelize.define('Department', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: '部门名称'
    },
    code: {
        type: DataTypes.STRING(50),
        allowNull: true,
        unique: true,
        comment: '部门编码'
    },
    parent_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '上级部门ID'
    },
    level: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: '部门层级'
    },
    path: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: '部门路径'
    },
    manager_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '部门负责人ID'
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive'),
        defaultValue: 'active',
        comment: '状态'
    }
}, {
    tableName: 'departments',
    comment: '部门表'
});

module.exports = Department;
