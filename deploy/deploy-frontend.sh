#!/bin/bash

# ============================================
# 资产管理系统 - 前端部署脚本
# ============================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}    资产管理系统 - 前端部署脚本${NC}"
echo -e "${GREEN}========================================${NC}"

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}请使用 root 用户运行此脚本${NC}"
    exit 1
fi

# 配置变量
APP_DIR="/var/www/asset-management"
FRONTEND_DIR="$APP_DIR/frontend"
BACKEND_DIR="$APP_DIR/backend"
SERVER_IP="你的服务器IP地址"

# 创建目录
echo -e "${YELLOW}[1/4] 创建目录...${NC}"
mkdir -p $APP_DIR
mkdir -p $BACKEND_DIR/uploads
mkdir -p $FRONTEND_DIR

# 安装依赖
echo -e "${YELLOW}[2/4] 安装 Node.js 依赖...${NC}"
cd $FRONTEND_DIR
npm install

# 创建生产环境配置
echo -e "${YELLOW}[3/4] 创建生产环境配置...${NC}"
cat > $FRONTEND_DIR/.env.production << EOF
VITE_API_BASE_URL=http://$SERVER_IP/api
EOF

# 构建生产版本
echo -e "${YELLOW}[4/4] 构建生产版本...${NC}"
npm run build

# 移动构建文件到后端 public 目录
rm -rf $BACKEND_DIR/public
cp -r $FRONTEND_DIR/dist $BACKEND_DIR/public

# 设置权限
chown -R www-data:www-data $APP_DIR
chmod -R 755 $APP_DIR

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}    前端部署完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "前端静态文件位置: $BACKEND_DIR/public"
echo -e "API地址: http://$SERVER_IP/api"
echo -e "${GREEN}========================================${NC}"
