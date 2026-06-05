const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SystemConfig = sequelize.define('SystemConfig', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    config_key: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        comment: '配置键'
    },
    config_value: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '配置值'
    },
    config_name: {
        type: DataTypes.STRING(200),
        allowNull: true,
        comment: '配置名称'
    },
    config_type: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: '配置类型'
    },
    description: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: '配置说明'
    },
    editable: {
        type: DataTypes.TINYINT(1),
        defaultValue: 1,
        comment: '是否可编辑'
    }
}, {
    tableName: 'system_configs',
    comment: '系统配置表',
    timestamps: false
});

module.exports = SystemConfig;
