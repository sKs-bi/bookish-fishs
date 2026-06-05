const { sequelize } = require('../models');
const bcrypt = require('bcryptjs');
const path = require('path');

async function initDatabase() {
    try {
        console.log('正在初始化数据库...');

        await sequelize.sync({ force: true });
        console.log('数据库表创建完成');

        const { Department, User, AssetType, SystemConfig } = require('../models');

        const departments = await Department.bulkCreate([
            { id: 1, name: '数智科技产业学院', code: 'SZKJ', parent_id: null, level: 1, path: '1', status: 'active' },
            { id: 2, name: '计算机系', code: 'JSJ', parent_id: 1, level: 2, path: '1,2', status: 'active' },
            { id: 3, name: '电子工程系', code: 'DZGX', parent_id: 1, level: 2, path: '1,3', status: 'active' },
            { id: 4, name: '软件工程系', code: 'RJGX', parent_id: 1, level: 2, path: '1,4', status: 'active' },
            { id: 5, name: '网络工程系', code: 'WLGX', parent_id: 1, level: 2, path: '1,5', status: 'active' },
            { id: 6, name: '实验室中心', code: 'SYS', parent_id: 1, level: 2, path: '1,6', status: 'active' },
            { id: 7, name: '行政办公室', code: 'XZBGS', parent_id: 1, level: 2, path: '1,7', status: 'active' },
            { id: 8, name: '财务处', code: 'CWC', parent_id: 1, level: 2, path: '1,8', status: 'active' },
        ]);
        console.log('部门数据创建完成');

        const hashedPassword = await bcrypt.hash('admin123', 10);
        const users = await User.bulkCreate([
            { id: 1, username: 'admin', password: hashedPassword, real_name: '系统管理员', email: 'admin@university.edu.cn', phone: '13800000001', role: 'super_admin', department_id: 1, status: 'active' },
            { id: 2, username: 'dept001', password: hashedPassword, real_name: '计算机系管理员', email: 'dept001@university.edu.cn', phone: '13800000002', role: 'dept_admin', department_id: 2, status: 'active' },
            { id: 3, username: 'dept002', password: hashedPassword, real_name: '电子工程系管理员', email: 'dept002@university.edu.cn', phone: '13800000003', role: 'dept_admin', department_id: 3, status: 'active' },
            { id: 4, username: 'dept003', password: hashedPassword, real_name: '软件工程系管理员', email: 'dept003@university.edu.cn', phone: '13800000004', role: 'dept_admin', department_id: 4, status: 'active' },
            { id: 5, username: 'user001', password: hashedPassword, real_name: '张三', email: 'user001@university.edu.cn', phone: '13800000011', role: 'normal_user', department_id: 2, status: 'active' },
            { id: 6, username: 'user002', password: hashedPassword, real_name: '李四', email: 'user002@university.edu.cn', phone: '13800000012', role: 'normal_user', department_id: 3, status: 'active' },
            { id: 7, username: 'user003', password: hashedPassword, real_name: '王五', email: 'user003@university.edu.cn', phone: '13800000013', role: 'normal_user', department_id: 4, status: 'active' },
        ]);
        console.log('用户数据创建完成');

        await AssetType.bulkCreate([
            { id: 1, name: '电子设备', code: 'DZSB', parent_id: null, depreciation_years: 3 },
            { id: 2, name: '计算机设备', code: 'JSJSB', parent_id: 1, depreciation_years: 3 },
            { id: 3, name: '办公设备', code: 'BGSB', parent_id: null, depreciation_years: 5 },
            { id: 4, name: '打印机', code: 'DYJ', parent_id: 3, depreciation_years: 5 },
            { id: 5, name: '投影设备', code: 'TYSB', parent_id: null, depreciation_years: 5 },
            { id: 6, name: '网络设备', code: 'WLSB', parent_id: null, depreciation_years: 5 },
            { id: 7, name: '实验设备', code: 'SYSB', parent_id: null, depreciation_years: 10 },
            { id: 8, name: '家具', code: 'JJ', parent_id: null, depreciation_years: 15 },
            { id: 9, name: '软件资产', code: 'RJJX', parent_id: null, depreciation_years: 3 },
            { id: 10, name: '图书档案', code: 'TSDA', parent_id: null, depreciation_years: 0 },
        ]);
        console.log('资产类型数据创建完成');

        await SystemConfig.bulkCreate([
            { config_key: 'system_name', config_value: '数智科技产业学院资产管理系统', config_name: '系统名称', config_type: 'text', description: '系统显示名称', editable: 1 },
            { config_key: 'system_logo', config_value: '/logo.png', config_name: '系统Logo', config_type: 'image', description: '系统Logo图片路径', editable: 1 },
            { config_key: 'warranty_warning_days', config_value: '30', config_name: '保修到期预警天数', config_type: 'number', description: '保修到期前多少天发送预警', editable: 1 },
            { config_key: 'loan_warning_days', config_value: '3', config_name: '借用到期预警天数', config_type: 'number', description: '借用到期前多少天发送预警', editable: 1 },
            { config_key: 'depreciation_warning_days', config_value: '90', config_name: '折旧到期预警天数', config_type: 'number', description: '折旧到期前多少天发送预警', editable: 1 },
            { config_key: 'default_depreciation_years', config_value: '5', config_name: '默认折旧年限', config_type: 'number', description: '资产默认折旧年限', editable: 1 },
            { config_key: 'auto_backup_enabled', config_value: 'true', config_name: '自动备份开关', config_type: 'boolean', description: '是否启用自动备份', editable: 1 },
            { config_key: 'auto_backup_time', config_value: '02:00', config_name: '自动备份时间', config_type: 'time', description: '每天自动备份执行时间', editable: 1 },
            { config_key: 'retention_days', config_value: '365', config_name: '日志保留天数', config_type: 'number', description: '审计日志保留天数', editable: 0 },
            { config_key: 'max_upload_size', config_value: '10', config_name: '最大上传文件大小(MB)', config_type: 'number', description: '上传文件大小限制', editable: 1 },
            { config_key: 'allowed_file_types', config_value: 'jpg,jpeg,png,xls,xlsx,pdf', config_name: '允许上传的文件类型', config_type: 'text', description: '文件上传类型限制', editable: 1 },
        ]);
        console.log('系统配置数据创建完成');

        console.log('数据库初始化完成！');
        process.exit(0);
    } catch (error) {
        console.error('数据库初始化失败:', error);
        process.exit(1);
    }
}

initDatabase();
