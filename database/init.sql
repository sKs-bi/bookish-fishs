-- ============================================
-- 数智科技产业学院资产管理系统 - 数据库初始化脚本
-- MySQL 8.0+
-- ============================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- 1. 创建数据库
-- ----------------------------
CREATE DATABASE IF NOT EXISTS `asset_management` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `asset_management`;

-- ----------------------------
-- 2. 部门表
-- ----------------------------
DROP TABLE IF EXISTS `departments`;
CREATE TABLE `departments` (
    `id` INT PRIMARY KEY AUTO_INCREMENT COMMENT '部门ID',
    `name` VARCHAR(100) NOT NULL COMMENT '部门名称',
    `code` VARCHAR(50) UNIQUE COMMENT '部门编码',
    `parent_id` INT DEFAULT NULL COMMENT '上级部门ID',
    `level` INT NOT NULL DEFAULT 1 COMMENT '部门层级',
    `path` VARCHAR(500) DEFAULT NULL COMMENT '部门路径',
    `manager_id` INT DEFAULT NULL COMMENT '部门负责人ID',
    `status` ENUM('active', 'inactive') DEFAULT 'active',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_parent` (`parent_id`),
    INDEX `idx_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='部门表';

-- ----------------------------
-- 3. 用户表
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
    `id` INT PRIMARY KEY AUTO_INCREMENT COMMENT '用户ID',
    `username` VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名/工号/学号',
    `password` VARCHAR(255) NOT NULL COMMENT '密码(bcrypt加密)',
    `real_name` VARCHAR(50) NOT NULL COMMENT '真实姓名',
    `email` VARCHAR(100) DEFAULT NULL COMMENT '邮箱',
    `phone` VARCHAR(20) DEFAULT NULL COMMENT '联系电话',
    `role` ENUM('super_admin', 'dept_admin', 'normal_user') NOT NULL DEFAULT 'normal_user' COMMENT '角色',
    `department_id` INT DEFAULT NULL COMMENT '所属部门ID',
    `status` ENUM('active', 'inactive', 'frozen') DEFAULT 'active' COMMENT '状态',
    `avatar` VARCHAR(255) DEFAULT NULL COMMENT '头像URL',
    `last_login_time` DATETIME DEFAULT NULL COMMENT '最后登录时间',
    `last_login_ip` VARCHAR(50) DEFAULT NULL COMMENT '最后登录IP',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `created_by` INT DEFAULT NULL COMMENT '创建人ID',
    INDEX `idx_role` (`role`),
    INDEX `idx_department` (`department_id`),
    INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ----------------------------
-- 4. 资产类型表
-- ----------------------------
DROP TABLE IF EXISTS `asset_types`;
CREATE TABLE `asset_types` (
    `id` INT PRIMARY KEY AUTO_INCREMENT COMMENT '类型ID',
    `name` VARCHAR(100) NOT NULL COMMENT '类型名称',
    `code` VARCHAR(50) UNIQUE COMMENT '类型编码',
    `parent_id` INT DEFAULT NULL COMMENT '上级类型ID',
    `depreciation_years` INT DEFAULT 5 COMMENT '默认折旧年限',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_parent` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='资产类型表';

-- ----------------------------
-- 5. 资产表
-- ----------------------------
DROP TABLE IF EXISTS `assets`;
CREATE TABLE `assets` (
    `id` INT PRIMARY KEY AUTO_INCREMENT COMMENT '资产ID',
    `asset_code` VARCHAR(50) UNIQUE NOT NULL COMMENT '资产编号(系统生成)',
    `serial_number` VARCHAR(100) UNIQUE DEFAULT NULL COMMENT '序列号',
    `name` VARCHAR(200) NOT NULL COMMENT '资产名称',
    `type_id` INT NOT NULL COMMENT '资产类型ID',
    `brand` VARCHAR(100) DEFAULT NULL COMMENT '品牌',
    `model` VARCHAR(100) DEFAULT NULL COMMENT '型号',
    `spec` VARCHAR(200) DEFAULT NULL COMMENT '规格参数',
    `purchase_date` DATE DEFAULT NULL COMMENT '购置日期',
    `purchase_price` DECIMAL(12,2) DEFAULT NULL COMMENT '购置价格',
    `net_value` DECIMAL(12,2) DEFAULT NULL COMMENT '当前净值',
    `supplier` VARCHAR(200) DEFAULT NULL COMMENT '供应商',
    `invoice_number` VARCHAR(100) DEFAULT NULL COMMENT '发票号',
    `warranty_end_date` DATE DEFAULT NULL COMMENT '保修截止日期',
    `location` VARCHAR(200) DEFAULT NULL COMMENT '存放位置',
    `department_id` INT NOT NULL COMMENT '所属部门',
    `responsible_id` INT NOT NULL COMMENT '责任人ID',
    `status` ENUM('pending', 'idle', 'in_use', 'repairing', 'transferred', 'scrapped') DEFAULT 'idle' COMMENT '状态',
    `qr_code` VARCHAR(255) DEFAULT NULL COMMENT '二维码路径',
    `purchase_application_id` INT DEFAULT NULL COMMENT '来源采购申请ID',
    `photos` JSON DEFAULT NULL COMMENT '资产照片JSON数组',
    `remarks` TEXT DEFAULT NULL COMMENT '备注',
    `scrap_date` DATE DEFAULT NULL COMMENT '报废日期',
    `scrap_reason` TEXT DEFAULT NULL COMMENT '报废原因',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `created_by` INT DEFAULT NULL COMMENT '创建人ID',
    INDEX `idx_type` (`type_id`),
    INDEX `idx_department` (`department_id`),
    INDEX `idx_responsible` (`responsible_id`),
    INDEX `idx_status` (`status`),
    INDEX `idx_serial` (`serial_number`),
    INDEX `idx_purchase_date` (`purchase_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='资产表';

-- ----------------------------
-- 6. 资产领用表
-- ----------------------------
DROP TABLE IF EXISTS `asset_loans`;
CREATE TABLE `asset_loans` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `asset_id` INT NOT NULL COMMENT '资产ID',
    `user_id` INT NOT NULL COMMENT '领用人ID',
    `department_id` INT NOT NULL COMMENT '领用部门ID',
    `loan_date` DATE DEFAULT NULL COMMENT '领用日期',
    `expected_return_date` DATE DEFAULT NULL COMMENT '预计归还日期',
    `actual_return_date` DATE DEFAULT NULL COMMENT '实际归还日期',
    `purpose` VARCHAR(500) DEFAULT NULL COMMENT '领用用途',
    `status` ENUM('pending', 'approved', 'returned', 'overdue', 'cancelled') DEFAULT 'pending' COMMENT '状态',
    `loan_method` VARCHAR(20) DEFAULT NULL COMMENT '领用方式: scan扫码/manual手工',
    `return_method` VARCHAR(20) DEFAULT NULL COMMENT '归还方式: scan扫码/manual手工',
    `loan_operator_id` INT DEFAULT NULL COMMENT '办理领用人ID',
    `return_operator_id` INT DEFAULT NULL COMMENT '办理归还人ID',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_asset` (`asset_id`),
    INDEX `idx_user` (`user_id`),
    INDEX `idx_status` (`status`),
    INDEX `idx_expected_return` (`expected_return_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='资产领用表';

-- ----------------------------
-- 7. 采购申请表
-- ----------------------------
DROP TABLE IF EXISTS `purchase_applications`;
CREATE TABLE `purchase_applications` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `application_code` VARCHAR(50) UNIQUE NOT NULL COMMENT '申请单号',
    `name` VARCHAR(200) NOT NULL COMMENT '资产名称',
    `type_id` INT DEFAULT NULL COMMENT '资产类型ID',
    `spec` VARCHAR(200) DEFAULT NULL COMMENT '规格参数',
    `quantity` INT NOT NULL DEFAULT 1 COMMENT '数量',
    `estimated_price` DECIMAL(12,2) DEFAULT NULL COMMENT '预估单价',
    `total_price` DECIMAL(12,2) DEFAULT NULL COMMENT '预估总价',
    `purpose` TEXT DEFAULT NULL COMMENT '用途说明',
    `required_date` DATE DEFAULT NULL COMMENT '需求日期',
    `applicant_id` INT NOT NULL COMMENT '申请人ID',
    `department_id` INT NOT NULL COMMENT '申请部门ID',
    `dept_audit_status` ENUM('pending', 'approved', 'rejected') DEFAULT 'pending' COMMENT '部门审核状态',
    `dept_audit_id` INT DEFAULT NULL COMMENT '部门审核人ID',
    `dept_audit_time` DATETIME DEFAULT NULL COMMENT '部门审核时间',
    `dept_audit_remark` TEXT DEFAULT NULL COMMENT '部门审核意见',
    `super_audit_status` ENUM('pending', 'approved', 'rejected') DEFAULT 'pending' COMMENT '超级管理员审核状态',
    `super_audit_id` INT DEFAULT NULL COMMENT '超级管理员审核人ID',
    `super_audit_time` DATETIME DEFAULT NULL COMMENT '超级管理员审核时间',
    `super_audit_remark` TEXT DEFAULT NULL COMMENT '超级管理员审核意见',
    `status` ENUM('draft', 'dept_pending', 'super_pending', 'approved', 'rejected', 'withdrawn') DEFAULT 'draft' COMMENT '状态',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_applicant` (`applicant_id`),
    INDEX `idx_department` (`department_id`),
    INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='采购申请表';

-- ----------------------------
-- 8. 维修申请表
-- ----------------------------
DROP TABLE IF EXISTS `repair_applications`;
CREATE TABLE `repair_applications` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `repair_code` VARCHAR(50) UNIQUE NOT NULL COMMENT '维修单号',
    `asset_id` INT NOT NULL COMMENT '资产ID',
    `asset_name` VARCHAR(200) DEFAULT NULL COMMENT '资产名称(冗余)',
    `reporter_id` INT NOT NULL COMMENT '报修人ID',
    `department_id` INT NOT NULL COMMENT '报修部门ID',
    `fault_description` TEXT DEFAULT NULL COMMENT '故障描述',
    `fault_photos` JSON DEFAULT NULL COMMENT '故障照片JSON',
    `report_date` DATE DEFAULT NULL COMMENT '报修日期',
    `audit_status` ENUM('pending', 'approved', 'rejected') DEFAULT 'pending' COMMENT '审核状态',
    `audit_id` INT DEFAULT NULL COMMENT '审核人ID',
    `audit_time` DATETIME DEFAULT NULL COMMENT '审核时间',
    `audit_remark` TEXT DEFAULT NULL COMMENT '审核意见',
    `repair_status` ENUM('pending', 'repairing', 'completed') DEFAULT 'pending' COMMENT '维修状态',
    `repair_person` VARCHAR(100) DEFAULT NULL COMMENT '维修人员',
    `repair_start_date` DATE DEFAULT NULL COMMENT '维修开始日期',
    `repair_end_date` DATE DEFAULT NULL COMMENT '维修完成日期',
    `repair_cost` DECIMAL(10,2) DEFAULT NULL COMMENT '维修费用',
    `repair_result` TEXT DEFAULT NULL COMMENT '维修结果',
    `acceptance_status` ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending' COMMENT '验收状态',
    `acceptance_id` INT DEFAULT NULL COMMENT '验收人ID',
    `acceptance_time` DATETIME DEFAULT NULL COMMENT '验收时间',
    `acceptance_remark` TEXT DEFAULT NULL COMMENT '验收意见',
    `status` ENUM('pending', 'in_repair', 'completed', 'rejected') DEFAULT 'pending',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_asset` (`asset_id`),
    INDEX `idx_reporter` (`reporter_id`),
    INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='维修申请表';

-- ----------------------------
-- 9. 资产调拨表
-- ----------------------------
DROP TABLE IF EXISTS `asset_transfers`;
CREATE TABLE `asset_transfers` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `transfer_code` VARCHAR(50) UNIQUE NOT NULL COMMENT '调拨单号',
    `asset_id` INT NOT NULL COMMENT '资产ID',
    `from_department_id` INT NOT NULL COMMENT '调出部门ID',
    `to_department_id` INT NOT NULL COMMENT '调入部门ID',
    `from_responsible_id` INT NOT NULL COMMENT '原责任人ID',
    `to_responsible_id` INT DEFAULT NULL COMMENT '新责任人ID',
    `transfer_reason` TEXT DEFAULT NULL COMMENT '调拨原因',
    `from_dept_audit_status` ENUM('pending', 'approved', 'rejected') DEFAULT 'pending' COMMENT '调出部门审核',
    `from_dept_audit_id` INT DEFAULT NULL COMMENT '调出部门审核人ID',
    `from_dept_audit_time` DATETIME DEFAULT NULL COMMENT '调出部门审核时间',
    `to_dept_audit_status` ENUM('pending', 'approved', 'rejected') DEFAULT 'pending' COMMENT '调入部门审核',
    `to_dept_audit_id` INT DEFAULT NULL COMMENT '调入部门审核人ID',
    `to_dept_audit_time` DATETIME DEFAULT NULL COMMENT '调入部门审核时间',
    `super_audit_status` ENUM('pending', 'approved', 'rejected') DEFAULT 'pending' COMMENT '超级管理员审核',
    `super_audit_id` INT DEFAULT NULL COMMENT '超级管理员审核人ID',
    `super_audit_time` DATETIME DEFAULT NULL COMMENT '超级管理员审核时间',
    `super_audit_remark` TEXT DEFAULT NULL COMMENT '超级管理员审核意见',
    `actual_transfer_date` DATE DEFAULT NULL COMMENT '实际调拨日期',
    `status` ENUM('pending', 'from_approved', 'to_approved', 'super_approved', 'completed', 'rejected') DEFAULT 'pending',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_asset` (`asset_id`),
    INDEX `idx_from_dept` (`from_department_id`),
    INDEX `idx_to_dept` (`to_department_id`),
    INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='资产调拨表';

-- ----------------------------
-- 10. 资产报废表
-- ----------------------------
DROP TABLE IF EXISTS `asset_scraps`;
CREATE TABLE `asset_scraps` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `scrap_code` VARCHAR(50) UNIQUE NOT NULL COMMENT '报废单号',
    `asset_id` INT NOT NULL COMMENT '资产ID',
    `applicant_id` INT NOT NULL COMMENT '申请人ID',
    `department_id` INT NOT NULL COMMENT '申请部门ID',
    `scrap_reason` TEXT NOT NULL COMMENT '报废原因',
    `scrap_photos` JSON DEFAULT NULL COMMENT '报废照片JSON',
    `original_value` DECIMAL(12,2) DEFAULT NULL COMMENT '原值',
    `net_value` DECIMAL(12,2) DEFAULT NULL COMMENT '账面净值',
    `audit_status` ENUM('pending', 'approved', 'rejected') DEFAULT 'pending' COMMENT '审核状态',
    `audit_id` INT DEFAULT NULL COMMENT '审核人ID',
    `audit_time` DATETIME DEFAULT NULL COMMENT '审核时间',
    `audit_remark` TEXT DEFAULT NULL COMMENT '审核意见',
    `finance_verify_status` ENUM('pending', 'verified') DEFAULT 'pending' COMMENT '财务核销状态',
    `finance_verify_id` INT DEFAULT NULL COMMENT '财务核销人ID',
    `finance_verify_time` DATETIME DEFAULT NULL COMMENT '财务核销时间',
    `status` ENUM('pending', 'approved', 'rejected', 'verified', 'completed') DEFAULT 'pending',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_asset` (`asset_id`),
    INDEX `idx_applicant` (`applicant_id`),
    INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='资产报废表';

-- ----------------------------
-- 11. 盘点任务表
-- ----------------------------
DROP TABLE IF EXISTS `check_tasks`;
CREATE TABLE `check_tasks` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `task_code` VARCHAR(50) UNIQUE NOT NULL COMMENT '任务编号',
    `task_name` VARCHAR(200) NOT NULL COMMENT '任务名称',
    `department_id` INT DEFAULT NULL COMMENT '盘点部门ID(为空则全量)',
    `start_date` DATE NOT NULL COMMENT '开始日期',
    `end_date` DATE NOT NULL COMMENT '结束日期',
    `status` ENUM('pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending' COMMENT '状态',
    `created_by` INT NOT NULL COMMENT '创建人ID',
    `total_assets` INT DEFAULT 0 COMMENT '总资产数',
    `normal_count` INT DEFAULT 0 COMMENT '正常数',
    `profit_count` INT DEFAULT 0 COMMENT '盘盈数',
    `loss_count` INT DEFAULT 0 COMMENT '盘亏数',
    `checked_count` INT DEFAULT 0 COMMENT '已盘点数',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_department` (`department_id`),
    INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='盘点任务表';

-- ----------------------------
-- 12. 盘点记录表
-- ----------------------------
DROP TABLE IF EXISTS `asset_checks`;
CREATE TABLE `asset_checks` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `task_id` INT NOT NULL COMMENT '盘点任务ID',
    `asset_id` INT NOT NULL COMMENT '资产ID',
    `checker_id` INT NOT NULL COMMENT '盘点人ID',
    `check_date` DATE NOT NULL COMMENT '盘点日期',
    `check_method` ENUM('scan', 'manual') DEFAULT 'scan' COMMENT '盘点方式',
    `check_result` ENUM('normal', 'profit', 'loss', 'not_found') DEFAULT 'normal' COMMENT '盘点结果',
    `actual_location` VARCHAR(200) DEFAULT NULL COMMENT '实际位置',
    `actual_status` VARCHAR(50) DEFAULT NULL COMMENT '实际状态',
    `remarks` TEXT DEFAULT NULL COMMENT '备注',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_task` (`task_id`),
    INDEX `idx_asset` (`asset_id`),
    INDEX `idx_checker` (`checker_id`),
    INDEX `idx_result` (`check_result`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='盘点记录表';

-- ----------------------------
-- 13. 审计日志表
-- ----------------------------
DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE `audit_logs` (
    `id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '日志ID',
    `user_id` INT NOT NULL COMMENT '操作人ID',
    `user_name` VARCHAR(50) DEFAULT NULL COMMENT '操作人姓名',
    `user_code` VARCHAR(50) DEFAULT NULL COMMENT '操作人工号/学号',
    `ip_address` VARCHAR(50) DEFAULT NULL COMMENT 'IP地址',
    `module` VARCHAR(100) NOT NULL COMMENT '操作模块',
    `action` VARCHAR(50) NOT NULL COMMENT '操作类型',
    `action_name` VARCHAR(100) DEFAULT NULL COMMENT '操作名称',
    `entity_type` VARCHAR(50) DEFAULT NULL COMMENT '操作对象类型',
    `entity_id` INT DEFAULT NULL COMMENT '操作对象ID',
    `before_data` JSON DEFAULT NULL COMMENT '操作前数据快照',
    `after_data` JSON DEFAULT NULL COMMENT '操作后数据快照',
    `result` ENUM('success', 'failed') DEFAULT 'success' COMMENT '操作结果',
    `error_message` TEXT DEFAULT NULL COMMENT '错误信息',
    `user_agent` VARCHAR(500) DEFAULT NULL COMMENT '浏览器信息',
    `operate_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
    INDEX `idx_user` (`user_id`),
    INDEX `idx_module` (`module`),
    INDEX `idx_action` (`action`),
    INDEX `idx_entity` (`entity_type`, `entity_id`),
    INDEX `idx_time` (`operate_time`),
    INDEX `idx_ip` (`ip_address`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='审计日志表';

-- ----------------------------
-- 14. 系统通知表
-- ----------------------------
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `title` VARCHAR(200) NOT NULL COMMENT '通知标题',
    `content` TEXT DEFAULT NULL COMMENT '通知内容',
    `type` ENUM('system', 'approval', 'warning', 'reminder') NOT NULL COMMENT '通知类型',
    `sender_id` INT DEFAULT NULL COMMENT '发送人ID',
    `recipient_id` INT DEFAULT NULL COMMENT '接收人ID(为空则全体)',
    `recipient_role` VARCHAR(50) DEFAULT NULL COMMENT '接收人角色',
    `related_module` VARCHAR(50) DEFAULT NULL COMMENT '关联模块',
    `related_id` INT DEFAULT NULL COMMENT '关联ID',
    `is_read` TINYINT DEFAULT 0 COMMENT '是否已读',
    `read_time` DATETIME DEFAULT NULL COMMENT '阅读时间',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_recipient` (`recipient_id`),
    INDEX `idx_type` (`type`),
    INDEX `idx_is_read` (`is_read`),
    INDEX `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统通知表';

-- ----------------------------
-- 15. 系统配置表
-- ----------------------------
DROP TABLE IF EXISTS `system_configs`;
CREATE TABLE `system_configs` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `config_key` VARCHAR(100) UNIQUE NOT NULL COMMENT '配置键',
    `config_value` TEXT DEFAULT NULL COMMENT '配置值',
    `config_name` VARCHAR(200) DEFAULT NULL COMMENT '配置名称',
    `config_type` VARCHAR(50) DEFAULT NULL COMMENT '配置类型',
    `description` VARCHAR(500) DEFAULT NULL COMMENT '配置说明',
    `editable` TINYINT DEFAULT 1 COMMENT '是否可编辑',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置表';

-- ----------------------------
-- 16. 数据备份记录表
-- ----------------------------
DROP TABLE IF EXISTS `backup_records`;
CREATE TABLE `backup_records` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `backup_name` VARCHAR(200) NOT NULL COMMENT '备份名称',
    `backup_file` VARCHAR(500) NOT NULL COMMENT '备份文件路径',
    `backup_type` ENUM('manual', 'auto') NOT NULL COMMENT '备份类型',
    `backup_size` BIGINT DEFAULT NULL COMMENT '备份文件大小(字节)',
    `status` ENUM('success', 'failed') NOT NULL COMMENT '备份状态',
    `error_message` TEXT DEFAULT NULL COMMENT '错误信息',
    `backup_by` INT DEFAULT NULL COMMENT '备份操作人ID',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_type` (`backup_type`),
    INDEX `idx_status` (`status`),
    INDEX `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='数据备份记录表';

-- ============================================
-- 种子数据
-- ============================================

-- ----------------------------
-- 插入默认部门数据
-- ----------------------------
INSERT INTO `departments` (`id`, `name`, `code`, `parent_id`, `level`, `path`, `status`) VALUES
(1, '数智科技产业学院', 'SZKJ', NULL, 1, '1', 'active'),
(2, '计算机系', 'JSJ', 1, 2, '1,2', 'active'),
(3, '电子工程系', 'DZGX', 1, 2, '1,3', 'active'),
(4, '软件工程系', 'RJGX', 1, 2, '1,4', 'active'),
(5, '网络工程系', 'WLGX', 1, 2, '1,5', 'active'),
(6, '实验室中心', 'SYS', 1, 2, '1,6', 'active'),
(7, '行政办公室', 'XZBGS', 1, 2, '1,7', 'active'),
(8, '财务处', 'CWC', 1, 2, '1,8', 'active');

-- ----------------------------
-- 插入默认用户 (密码都是 admin123)
-- bcrypt加密后的密码: $2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
-- ----------------------------
INSERT INTO `users` (`id`, `username`, `password`, `real_name`, `email`, `phone`, `role`, `department_id`, `status`) VALUES
(1, 'admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '系统管理员', 'admin@university.edu.cn', '13800000001', 'super_admin', 1, 'active'),
(2, 'dept001', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '计算机系管理员', 'dept001@university.edu.cn', '13800000002', 'dept_admin', 2, 'active'),
(3, 'dept002', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '电子工程系管理员', 'dept002@university.edu.cn', '13800000003', 'dept_admin', 3, 'active'),
(4, 'dept003', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '软件工程系管理员', 'dept003@university.edu.cn', '13800000004', 'dept_admin', 4, 'active'),
(5, 'user001', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '张三', 'user001@university.edu.cn', '13800000011', 'normal_user', 2, 'active'),
(6, 'user002', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '李四', 'user002@university.edu.cn', '13800000012', 'normal_user', 3, 'active'),
(7, 'user003', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '王五', 'user003@university.edu.cn', '13800000013', 'normal_user', 4, 'active');

-- ----------------------------
-- 插入资产类型数据
-- ----------------------------
INSERT INTO `asset_types` (`id`, `name`, `code`, `parent_id`, `depreciation_years`) VALUES
(1, '电子设备', 'DZSB', NULL, 3),
(2, '计算机设备', 'JSJSB', 1, 3),
(3, '办公设备', 'BGSB', NULL, 5),
(4, '打印机', 'DYJ', 3, 5),
(5, '投影设备', 'TYSB', NULL, 5),
(6, '网络设备', 'WLSB', NULL, 5),
(7, '实验设备', 'SYSB', NULL, 10),
(8, '家具', 'JJ', NULL, 15),
(9, '软件资产', 'RJJX', NULL, 3),
(10, '图书档案', 'TSDA', NULL, 0);

-- ----------------------------
-- 插入系统配置数据
-- ----------------------------
INSERT INTO `system_configs` (`config_key`, `config_value`, `config_name`, `config_type`, `description`, `editable`) VALUES
('system_name', '数智科技产业学院资产管理系统', '系统名称', 'text', '系统显示名称', 1),
('system_logo', '/logo.png', '系统Logo', 'image', '系统Logo图片路径', 1),
('warranty_warning_days', '30', '保修到期预警天数', 'number', '保修到期前多少天发送预警', 1),
('loan_warning_days', '3', '借用到期预警天数', 'number', '借用到期前多少天发送预警', 1),
('depreciation_warning_days', '90', '折旧到期预警天数', 'number', '折旧到期前多少天发送预警', 1),
('default_depreciation_years', '5', '默认折旧年限', 'number', '资产默认折旧年限', 1),
('auto_backup_enabled', 'true', '自动备份开关', 'boolean', '是否启用自动备份', 1),
('auto_backup_time', '02:00', '自动备份时间', 'time', '每天自动备份执行时间', 1),
('retention_days', '365', '日志保留天数', 'number', '审计日志保留天数', 0),
('max_upload_size', '10', '最大上传文件大小(MB)', 'number', '上传文件大小限制', 1),
('allowed_file_types', 'jpg,jpeg,png,xls,xlsx,pdf', '允许上传的文件类型', 'text', '文件上传类型限制', 1);

-- ----------------------------
-- 更新部门负责人
-- ----------------------------
UPDATE `departments` SET `manager_id` = 1 WHERE `id` = 1;
UPDATE `departments` SET `manager_id` = 2 WHERE `id` = 2;
UPDATE `departments` SET `manager_id` = 3 WHERE `id` = 3;
UPDATE `departments` SET `manager_id` = 4 WHERE `id` = 4;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- 完成
-- ============================================
