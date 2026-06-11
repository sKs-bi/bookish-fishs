const { callQianwen } = require('../services/aiService');
const { Asset, User, Department, AssetType, AssetLoan, RepairApplication, PurchaseApplication } = require('../models');
const { Op } = require('sequelize');

const chat = async (req, res) => {
  try {
    const { message, apiKey } = req.body;
    
    if (!apiKey) {
      return res.status(400).json({ code: 400, message: '请先输入API Key' });
    }
    
    if (!message || !message.trim()) {
      return res.status(400).json({ code: 400, message: '请输入问题内容' });
    }

    // 获取用户信息
    const user = await User.findByPk(req.user.id, {
      include: [{ model: Department, as: 'department' }]
    });
    
    // 获取资产统计
    const assetCount = await Asset.count();
    const availableCount = await Asset.count({ where: { status: 'available' } });
    const inUseCount = await Asset.count({ where: { status: 'in_use' } });
    const maintenanceCount = await Asset.count({ where: { status: 'maintenance' } });
    
    // 获取部门资产统计
    let deptAssetCount = 0;
    if (user.department_id) {
      deptAssetCount = await Asset.count({ where: { department_id: user.department_id } });
    }

    // 构建上下文
    const context = `当前用户：${user.real_name}（${user.role === 'super_admin' ? '超级管理员' : user.role === 'dept_admin' ? '部门管理员' : '普通用户'}）
所属部门：${user.department?.name || '未分配'}
资产总数：${assetCount}件
可用资产：${availableCount}件
使用中：${inUseCount}件
维修中：${maintenanceCount}件
${user.department_id ? `本部门资产：${deptAssetCount}件` : ''}`;

    const reply = await callQianwen(message, apiKey, context);
    res.json({ code: 200, data: { reply } });
  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({ code: 500, message: error.message || 'AI服务暂时不可用' });
  }
};

// 获取资产数据供AI分析
const getAssetData = async (req, res) => {
  try {
    const { apiKey } = req.body;
    
    if (!apiKey) {
      return res.status(400).json({ code: 400, message: '请先输入API Key' });
    }

    // 获取资产类型分布
    const assetTypes = await AssetType.findAll({
      include: [{
        model: Asset,
        as: 'assets',
        attributes: ['id']
      }]
    });

    const typeDistribution = assetTypes.map(t => ({
      name: t.name,
      count: t.assets?.length || 0
    }));

    // 获取部门资产分布
    const departments = await Department.findAll({
      include: [{
        model: Asset,
        as: 'assets',
        attributes: ['id']
      }]
    });

    const deptDistribution = departments.map(d => ({
      name: d.name,
      count: d.assets?.length || 0
    }));

    // 获取最近领用记录
    const recentLoans = await AssetLoan.findAll({
      limit: 5,
      order: [['created_at', 'DESC']],
      include: [
        { model: Asset, as: 'asset', attributes: ['name', 'asset_code'] },
        { model: User, as: 'user', attributes: ['real_name'] }
      ]
    });

    res.json({
      code: 200,
      data: {
        typeDistribution,
        deptDistribution,
        recentLoans: recentLoans.map(l => ({
          assetName: l.asset?.name,
          assetCode: l.asset?.asset_code,
          userName: l.user?.real_name,
          createdAt: l.created_at
        }))
      }
    });
  } catch (error) {
    console.error('Get asset data error:', error);
    res.status(500).json({ code: 500, message: error.message });
  }
};

module.exports = { chat, getAssetData };
