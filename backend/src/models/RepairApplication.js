const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RepairApplication = sequelize.define('RepairApplication', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    repair_code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        comment: '维修单号'
    },
    asset_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: '资产ID'
    },
    asset_name: {
        type: DataTypes.STRING(200),
        allowNull: true,
        comment: '资产名称(冗余)'
    },
    reporter_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: '报修人ID'
    },
    department_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: '报修部门ID'
    },
    fault_description: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '故障描述'
    },
    fault_photos: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: '故障照片JSON'
    },
    report_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: '报修日期'
    },
    audit_status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending',
        comment: '审核状态'
    },
    audit_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '审核人ID'
    },
    audit_time: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '审核时间'
    },
    audit_remark: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '审核意见'
    },
    repair_status: {
        type: DataTypes.ENUM('pending', 'repairing', 'completed'),
        defaultValue: 'pending',
        comment: '维修状态'
    },
    repair_person: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: '维修人员'
    },
    repair_start_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: '维修开始日期'
    },
    repair_end_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: '维修完成日期'
    },
    repair_cost: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: '维修费用'
    },
    repair_result: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '维修结果'
    },
    acceptance_status: {
        type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
        defaultValue: 'pending',
        comment: '验收状态'
    },
    acceptance_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '验收人ID'
    },
    acceptance_time: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '验收时间'
    },
    acceptance_remark: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '验收意见'
    },
    status: {
        type: DataTypes.ENUM('pending', 'in_repair', 'completed', 'rejected'),
        defaultValue: 'pending',
        comment: '状态'
    }
}, {
    tableName: 'repair_applications',
    comment: '维修申请表'
});

module.exports = RepairApplication;
