# 信创管理学院资产管理系统 - 本地启动指南

## 环境要求
- Node.js 18+
- npm

## 启动步骤

### 1. 安装后端依赖
```bash
cd d:\hdsnc\backend
npm install
```

### 2. 安装前端依赖
```bash
cd d:\hdsnc\frontend
npm install
```

### 3. 初始化数据库（首次运行）
```bash
cd d:\hdsnc\backend
npm run init-db
```
这会自动创建SQLite数据库并插入默认数据。

### 4. 启动后端服务
```bash
cd d:\hdsnc\backend
npm run dev
```
后端将运行在 http://localhost:3000

### 5. 启动前端服务（新开一个终端窗口）
```bash
cd d:\hdsnc\frontend
npm run dev
```
前端将运行在 http://localhost:5173

## 默认登录账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 超级管理员 | admin | admin123 |
| 部门管理员 | dept001 | admin123 |
| 普通用户 | user001 | admin123 |

## 快速启动脚本

如果上述步骤太麻烦，您可以创建一个启动脚本：

```batch
@echo off
title 信创管理学院资产管理系统

echo [1/4] 安装后端依赖...
cd /d d:\hdsnc\backend
npm install

echo [2/4] 初始化数据库...
npm run init-db

echo [3/4] 启动后端服务...
start "后端服务" npm run dev

echo [4/4] 安装前端依赖并启动...
cd /d d:\hdsnc\frontend
npm install
start "前端服务" npm run dev

echo.
echo 系统启动中...
echo 后端: http://localhost:3000
echo 前端: http://localhost:5173
pause
```

将此内容保存为 `start.bat` 并双击运行即可。
