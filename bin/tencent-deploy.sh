#!/bin/bash

# ================================================
# 腾讯云配置 - 请根据实际情况修改
# ================================================
# TODO: 请填入你的腾讯云服务器信息
SERVER_IP="your-tencent-cloud-ip"
SSH_USER="ubuntu"
# 统一部署基础路径
REMOTE_DEPLOY_BASE="/opt/1panel/www/sites"
# 应用部署路径
REMOTE_TARGET="$REMOTE_DEPLOY_BASE/kiro-travel"
# PM2 进程名称
APP_PM2_NAME="kiro-travel"

# ================================================
# 颜色定义
# ================================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🚀 部署 Kiro Travel 到腾讯云...${NC}"

# 获取项目根目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# 1. 本地构建
echo -e "${GREEN}📦 本地构建 Next.js 应用...${NC}"
cd "$PROJECT_ROOT"

# 复制 .env.prod 为 .env.production（Next.js 构建时会自动读取）
if [ -f ".env.prod" ]; then
    cp .env.prod .env.production
    echo -e "${GREEN}✓ 已复制 .env.prod 为 .env.production${NC}"
fi

# 安装依赖并构建
npm install
npm run build

# 2. 准备部署文件
echo -e "${GREEN}📦 准备部署文件...${NC}"
mkdir -p "$PROJECT_ROOT/deploy_tmp"

# 复制必要文件
rsync -av --progress "$PROJECT_ROOT/" "$PROJECT_ROOT/deploy_tmp/" \
    --exclude node_modules \
    --exclude .git \
    --exclude .next/cache \
    --exclude deploy_tmp \
    --exclude data \
    --exclude .env.* \
    --exclude .DS_Store

# 将 .env.prod 复制到部署包
cp "$PROJECT_ROOT/.env.prod" "$PROJECT_ROOT/deploy_tmp/.env.production"

# 3. 打包
echo -e "${GREEN}📦 打包归档...${NC}"
rm -f "$PROJECT_ROOT/kiro_travel_deploy.tar.gz"
# 清理 Mac 元数据文件
find "$PROJECT_ROOT/deploy_tmp" -name "._*" -delete
find "$PROJECT_ROOT/deploy_tmp" -name ".DS_Store" -delete
# 创建归档
COPYFILE_DISABLE=1 tar -czf "$PROJECT_ROOT/kiro_travel_deploy.tar.gz" -C "$PROJECT_ROOT/deploy_tmp" .
rm -rf "$PROJECT_ROOT/deploy_tmp"

# 4. 上传
echo -e "${GREEN}📤 上传归档到 $SERVER_IP...${NC}"
REMOTE_UPLOAD_BASE="/home/$SSH_USER/deploy_upload"
ssh -o StrictHostKeyChecking=no $SSH_USER@$SERVER_IP "mkdir -p $REMOTE_UPLOAD_BASE && chmod 777 $REMOTE_UPLOAD_BASE"
scp -o StrictHostKeyChecking=no "$PROJECT_ROOT/kiro_travel_deploy.tar.gz" "$SSH_USER@$SERVER_IP:$REMOTE_UPLOAD_BASE/"
rm -f "$PROJECT_ROOT/kiro_travel_deploy.tar.gz"

# 5. 远程安装
echo -e "${GREEN}🔧 远程安装...${NC}"
ssh -o StrictHostKeyChecking=no -t $SSH_USER@$SERVER_IP "sudo bash -c '
    TARGET=\"$REMOTE_TARGET\"
    echo \"   目标路径: \$TARGET\"

    # A. 停止 PM2 进程
    echo \"   🛑 停止 PM2 进程 $APP_PM2_NAME...\"
    su - $SSH_USER -c \"pm2 stop $APP_PM2_NAME\" 2>/dev/null || true

    # B. 清理旧文件（保留 data 目录）
    echo \"   🧹 清理旧文件（保留 data 目录）...\"
    mkdir -p \$TARGET
    find \$TARGET -mindepth 1 -maxdepth 1 ! -name \"data\" -exec rm -rf {} +

    # 确保 data 目录存在
    mkdir -p \$TARGET/data
    chown -R $SSH_USER:$SSH_USER \$TARGET/data

    # C. 解压归档
    echo \"   📦 解压归档...\"
    tar -xzf /home/$SSH_USER/deploy_upload/kiro_travel_deploy.tar.gz -C \$TARGET
    rm -rf /home/$SSH_USER/deploy_upload

    # 强制清理 Mac 元数据
    echo \"   🧹 清理 Mac 元数据文件...\"
    find \$TARGET -name \"._*\" -delete
    find \$TARGET -name \".DS_Store\" -delete

    # D. 安装生产依赖
    echo \"   📦 安装生产依赖...\"
    cd \$TARGET
    su - $SSH_USER -c \"cd \$TARGET && npm install --production\"

    # E. 权限设置
    chown -R $SSH_USER:$SSH_USER \$TARGET

    # F. 启动 PM2
    echo \"   🚀 启动 PM2 进程...\"
    su - $SSH_USER -c \"cd \$TARGET && pm2 start npm --name $APP_PM2_NAME -- start\"
    su - $SSH_USER -c \"pm2 save\"
    echo \"   ✅ 应用已启动\"
'"

echo -e "${GREEN}✅ 部署完成！${NC}"
echo -e "${YELLOW}提示：请访问你的域名查看部署结果${NC}"
