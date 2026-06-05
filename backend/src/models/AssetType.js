const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AssetType = sequelize.define('AssetType', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: '类型名称'
    },
    code: {
        type: DataTypes.STRING(50),
        allowNull: true,
        unique: true,
        comment: '类型编码'
    },
    parent_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '上级类型ID'
    },
    depreciation_years: {
        type: DataTypes.INTEGER,
        defaultValue: 5,
        comment: '默认折旧年限'
    }
}, {
    tableName: 'asset_types',
    comment: '资产类型表'
});

module.exports = AssetType;
