# 信创管理学院资产管理系统

符合教育部高校财务审计标准的专业资产管理平台，解决高校账实不符、责任不清、审计无据三大核心痛点。

## 系统特性

- **三角色权限隔离**：超级管理员、部门管理员、普通用户严格权限控制
- **全链路审计日志**：所有操作永久记录，数据不可篡改
- **资产全生命周期管理**：采购→入库→领用→维修→调拨→报废
- **智能预警系统**：保修、借用、折旧到期提前预警
- **数据可视化看板**：实时掌握资产分布与变动
- **响应式设计**：适配桌面端、平板端、移动端

## 技术栈

### 前端
- React 18
- Tailwind CSS 3
- ECharts 5
- React Router 6
- Zustand (状态管理)
- Axios (HTTP客户端)
- Vite (构建工具)

### 后端
- Node.js 18
- Express 4
- MySQL 8.0
- Sequelize 6 (ORM)
- JWT (认证)
- bcrypt (密码加密)
- node-cron (定时任务)

## 快速启动

### 方式一：Docker一键部署（推荐）

```bash
cd docker
docker-compose up -d
```

访问地址：http://localhost

### 方式二：本地开发

#### 1. 环境要求
- Node.js 18+
- MySQL 8.0+
- npm 或 yarn

#### 2. 数据库初始化

```bash
# 创建数据库并导入初始数据
mysql -u root -p < database/init.sql
```

#### 3. 后端启动

```bash
cd backend
npm install
npm run dev
```

#### 4. 前端启动

```bash
cd frontend
npm install
npm run dev
```

访问地址：http://localhost:5173

## 默认账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 超级管理员 | admin | admin123 |
| 部门管理员 | dept001 | admin123 |
| 普通用户 | user001 | admin123 |

## 功能模块

### 1. 用户认证与系统管理
- 登录/注册（注册需审核）
- 个人中心
- 用户管理
- 部门管理
- 系统配置
- 数据备份与恢复

### 2. 资产管理
- 资产入库（手动/批量导入）
- 资产领用与归还（扫码）
- 资产调拨
- 资产维修
- 资产盘点
- 资产报废
- 二维码打印

### 3. 审批流程
- 采购申请审批
- 领用审批
- 维修审批
- 调拨审批
- 报废审批

### 4. 报表与统计
- 仪表盘概览
- 资产状态分布
- 部门资产分布
- 维修费用统计

### 5. 审计日志
- 全链路操作记录
- 日志查询与导出

## 接口文档

启动后端服务后，访问：http://localhost:3000/api/health

## 目录结构

```
asset-management-system/
├── backend/                    # 后端项目
│   ├── src/
│   │   ├── config/            # 配置文件
│   │   ├── controllers/       # 控制器
│   │   ├── middleware/        # 中间件
│   │   ├── models/            # 数据模型
│   │   ├── routes/            # 路由
│   │   ├── services/          # 业务逻辑
│   │   ├── utils/             # 工具函数
│   │   └── app.js             # 应用入口
│   └── package.json
│
├── frontend/                   # 前端项目
│   ├── src/
│   │   ├── components/        # 公共组件
│   │   ├── pages/            # 页面组件
│   │   ├── services/         # API服务
│   │   ├── stores/           # 状态管理
│   │   └── styles/           # 全局样式
│   └── package.json
│
├── database/                   # 数据库脚本
│   └── init.sql              # 初始化脚本
│
├── docker/                     # Docker配置
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   ├── docker-compose.yml
│   └── nginx.conf
│
└── README.md
```

## 安全说明

- 所有用户密码使用bcrypt加密存储
- 使用JWT Token进行身份认证
- 所有操作记录审计日志，不可删除修改
- 敏感操作自动通知超级管理员

## 数据备份

系统支持手动备份和自动定时备份（每天凌晨2:00）。

备份文件存储在 `backend/backups/` 目录。

## 许可证

MIT License
