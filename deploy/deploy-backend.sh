#!/bin/bash

# ============================================
# 资产管理系统 - 后端部署脚本
# ============================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}    资产管理系统 - 后端部署脚本${NC}"
echo -e "${GREEN}========================================${NC}"

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}请使用 root 用户运行此脚本${NC}"
    exit 1
fi

# 配置变量
APP_DIR="/var/www/asset-management"
BACKEND_DIR="$APP_DIR/backend"
SERVICE_NAME="asset-backend"
PORT=3000

# 创建应用目录
echo -e "${YELLOW}[1/6] 创建应用目录...${NC}"
mkdir -p $APP_DIR
mkdir -p $BACKEND_DIR

# 安装 Node.js 18
echo -e "${YELLOW}[2/6] 安装 Node.js 18...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi
node --version
npm --version

# 安装 PM2
echo -e "${YELLOW}[3/6] 安装 PM2...${NC}"
npm install -g pm2

# 安装 MySQL
echo -e "${YELLOW}[4/6] 安装并配置 MySQL...${NC}"
apt-get update
apt-get install -y mysql-server

# 启动 MySQL
systemctl start mysql
systemctl enable mysql

# 创建数据库和用户
echo -e "${YELLOW}配置数据库...${NC}"
mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'AssetDB@2024';"
mysql -e "CREATE DATABASE IF NOT EXISTS asset_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -e "CREATE USER IF NOT EXISTS 'asset'@'localhost' IDENTIFIED BY 'AssetDB@2024';"
mysql -e "GRANT ALL PRIVILEGES ON asset_management.* TO 'asset'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"

# 创建环境变量文件
echo -e "${YELLOW}[5/6] 创建环境变量文件...${NC}"
cat > $BACKEND_DIR/.env << EOF
NODE_ENV=production
PORT=$PORT
DB_HOST=localhost
DB_USER=asset
DB_PASSWORD=AssetDB@2024
DB_NAME=asset_management
DB_DIALECT=mysql
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=7d
EOF

# 安装依赖
echo -e "${YELLOW}[6/6] 安装依赖并启动...${NC}"
cd $BACKEND_DIR
npm install --production

# 初始化数据库
echo -e "${YELLOW}初始化数据库...${NC}"
node src/scripts/init-db.js

# 使用 PM2 启动
pm2 delete $SERVICE_NAME 2>/dev/null || true
pm2 start src/app.js --name $SERVICE_NAME
pm2 startup
pm2 save

# 设置目录权限
chown -R www-data:www-data $APP_DIR

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}    后端部署完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "后端服务地址: http://localhost:$PORT"
echo -e "运行状态: $(pm2 status $SERVICE_NAME | grep -o 'online' || echo '启动中...')"
echo -e ""
echo -e "常用命令:"
echo -e "  查看日志: pm2 logs $SERVICE_NAME"
echo -e "  重启服务: pm2 restart $SERVICE_NAME"
echo -e "  查看状态: pm2 status"
echo -e "${GREEN}========================================${NC}"
