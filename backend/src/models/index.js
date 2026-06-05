const sequelize = require('../config/database');
const User = require('./User');
const Department = require('./Department');
const AssetType = require('./AssetType');
const Asset = require('./Asset');
const AssetLoan = require('./AssetLoan');
const PurchaseApplication = require('./PurchaseApplication');
const RepairApplication = require('./RepairApplication');
const AssetTransfer = require('./AssetTransfer');
const AssetScrap = require('./AssetScrap');
const CheckTask = require('./CheckTask');
const AssetCheck = require('./AssetCheck');
const AuditLog = require('./AuditLog');
const Notification = require('./Notification');
const SystemConfig = require('./SystemConfig');
const BackupRecord = require('./BackupRecord');
const AssetRejection = require('./AssetRejection');
const RoleUpgradeRequest = require('./RoleUpgradeRequest');

Department.hasMany(User, { foreignKey: 'department_id', as: 'users' });
User.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });

Department.hasMany(Asset, { foreignKey: 'department_id', as: 'assets' });
Asset.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });

User.hasMany(Asset, { foreignKey: 'responsible_id', as: 'responsibleAssets' });
Asset.belongsTo(User, { foreignKey: 'responsible_id', as: 'responsible' });

AssetType.hasMany(Asset, { foreignKey: 'type_id', as: 'assets' });
Asset.belongsTo(AssetType, { foreignKey: 'type_id', as: 'type' });

Asset.hasMany(AssetLoan, { foreignKey: 'asset_id', as: 'loans' });
AssetLoan.belongsTo(Asset, { foreignKey: 'asset_id', as: 'asset' });

User.hasMany(AssetLoan, { foreignKey: 'user_id', as: 'loans' });
AssetLoan.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Asset.hasMany(PurchaseApplication, { foreignKey: 'purchase_application_id', as: 'assets' });
PurchaseApplication.hasMany(Asset, { foreignKey: 'purchase_application_id', as: 'purchasedAssets' });

User.hasMany(PurchaseApplication, { foreignKey: 'applicant_id', as: 'purchaseApplications' });
PurchaseApplication.belongsTo(User, { foreignKey: 'applicant_id', as: 'applicant' });

Department.hasMany(PurchaseApplication, { foreignKey: 'department_id', as: 'purchaseApplications' });
PurchaseApplication.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });

AssetType.hasMany(PurchaseApplication, { foreignKey: 'type_id', as: 'purchaseApplications' });
PurchaseApplication.belongsTo(AssetType, { foreignKey: 'type_id', as: 'type' });

Asset.hasMany(RepairApplication, { foreignKey: 'asset_id', as: 'repairs' });
RepairApplication.belongsTo(Asset, { foreignKey: 'asset_id', as: 'asset' });

User.hasMany(RepairApplication, { foreignKey: 'reporter_id', as: 'repairReports' });
RepairApplication.belongsTo(User, { foreignKey: 'reporter_id', as: 'reporter' });

CheckTask.hasMany(AssetCheck, { foreignKey: 'task_id', as: 'checks' });
AssetCheck.belongsTo(CheckTask, { foreignKey: 'task_id', as: 'task' });

Asset.hasMany(AssetCheck, { foreignKey: 'asset_id', as: 'checks' });
AssetCheck.belongsTo(Asset, { foreignKey: 'asset_id', as: 'asset' });

User.hasMany(AssetCheck, { foreignKey: 'checker_id', as: 'checks' });
AssetCheck.belongsTo(User, { foreignKey: 'checker_id', as: 'checker' });

User.hasMany(AssetRejection, { foreignKey: 'user_id', as: 'rejections' });
AssetRejection.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(AssetRejection, { foreignKey: 'rejected_by', as: 'rejectedRecords' });
AssetRejection.belongsTo(User, { foreignKey: 'rejected_by', as: 'rejector' });

User.hasMany(RoleUpgradeRequest, { foreignKey: 'user_id', as: 'roleUpgradeRequests' });
RoleUpgradeRequest.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(RoleUpgradeRequest, { foreignKey: 'reviewed_by', as: 'reviewedRequests' });
RoleUpgradeRequest.belongsTo(User, { foreignKey: 'reviewed_by', as: 'reviewer' });

module.exports = {
    sequelize,
    User,
    Department,
    AssetType,
    Asset,
    AssetLoan,
    PurchaseApplication,
    RepairApplication,
    AssetTransfer,
    AssetScrap,
    CheckTask,
    AssetCheck,
    AuditLog,
    Notification,
    SystemConfig,
    BackupRecord,
    AssetRejection,
    RoleUpgradeRequest
};
