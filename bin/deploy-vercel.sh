#!/bin/bash

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${NC}  🚀 部署 Kiro Travel 到 Vercel"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_ROOT/.env.vercel"

# 检查 .env.vercel 文件是否存在
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}✗${NC} 环境配置文件不存在: $ENV_FILE"
    exit 1
fi

# 检查 Vercel CLI 是否安装
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}✗${NC} Vercel CLI 未安装"
    echo ""
    echo "请先安装 Vercel CLI:"
    echo "  npm install -g vercel"
    exit 1
fi

echo -e "${BLUE}ℹ${NC} 环境配置: .env.vercel"
echo ""

# 警告：SQLite 数据库限制
echo -e "${YELLOW}⚠️  重要提示：${NC}"
echo -e "${YELLOW}   Vercel Serverless 环境不支持持久化文件系统${NC}"
echo -e "${YELLOW}   SQLite 数据库在每次部署后会丢失${NC}"
echo -e "${YELLOW}   建议改用 Vercel Postgres / Neon / Supabase${NC}"
echo ""
echo -ne "${YELLOW}是否继续部署到 Vercel? (y/N): ${NC}"
read -r confirm
if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
    echo "部署已取消"
    exit 0
fi

cd "$PROJECT_ROOT"

# 部署到 Vercel
echo ""
echo -e "${BLUE}ℹ${NC} 正在部署到 Vercel..."
echo ""

# 使用 --prod 参数部署到生产环境
vercel --prod

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓${NC} 部署成功！"
    echo ""
    echo -e "${BLUE}ℹ${NC} 请访问 Vercel Dashboard 查看部署详情"
    echo "   https://vercel.com/dashboard"
else
    echo ""
    echo -e "${RED}✗${NC} 部署失败"
    exit 1
fi
