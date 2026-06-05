const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Asset = sequelize.define('Asset', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    asset_code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        comment: '资产编号(系统生成)'
    },
    serial_number: {
        type: DataTypes.STRING(100),
        allowNull: true,
        unique: true,
        comment: '序列号'
    },
    name: {
        type: DataTypes.STRING(200),
        allowNull: false,
        comment: '资产名称'
    },
    type_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '资产类型ID'
    },
    brand: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: '品牌'
    },
    model: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: '型号'
    },
    spec: {
        type: DataTypes.STRING(200),
        allowNull: true,
        comment: '规格参数'
    },
    purchase_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: '购置日期'
    },
    purchase_price: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        comment: '购置价格'
    },
    net_value: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        comment: '当前净值'
    },
    supplier: {
        type: DataTypes.STRING(200),
        allowNull: true,
        comment: '供应商'
    },
    invoice_number: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: '发票号'
    },
    warranty_end_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: '保修截止日期'
    },
    location: {
        type: DataTypes.STRING(200),
        allowNull: true,
        comment: '存放位置'
    },
    department_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '所属部门'
    },
    responsible_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '责任人ID'
    },
    status: {
        type: DataTypes.ENUM('pending', 'pending_delete', 'idle', 'in_use', 'repairing', 'transferred', 'scrapped'),
        defaultValue: 'idle',
        comment: '状态'
    },
    qr_code: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: '二维码路径'
    },
    purchase_application_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '来源采购申请ID'
    },
    photos: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: '资产照片JSON数组'
    },
    remarks: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '备注'
    },
    last_repair_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: '上次检修日期'
    },
    scrap_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: '报废日期'
    },
    scrap_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '报废原因'
    },
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '创建人ID'
    },
    delete_requested_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '删除申请人ID'
    }
}, {
    tableName: 'assets',
    comment: '资产表'
});

module.exports = Asset;
