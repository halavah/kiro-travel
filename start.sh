#!/bin/bash

# Navigate to the directory where the script is located
cd "$(dirname "$0")"

# Color definitions
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to kill processes on port 3000
kill_port_3000() {
    echo -e "${YELLOW}检查端口 3000 占用情况...${NC}"
    PID=$(lsof -ti:3000)
    if [ ! -z "$PID" ]; then
        echo -e "${YELLOW}发现端口 3000 被进程 $PID 占用，正在终止...${NC}"
        kill -9 $PID 2>/dev/null
        echo -e "${GREEN}✓ 已终止进程 $PID${NC}"
    else
        echo -e "${GREEN}✓ 端口 3000 未被占用${NC}"
    fi
}

# Function to kill all Next.js processes
kill_next_processes() {
    echo -e "${YELLOW}清理所有 Next.js 进程...${NC}"
    pkill -f "next dev" 2>/dev/null
    pkill -f "next-server" 2>/dev/null
    pkill -f "next build" 2>/dev/null
    pkill -f "next start" 2>/dev/null
    echo -e "${GREEN}✓ Next.js 进程已清理${NC}"
}

# Function to clean .next directory
clean_next_dir() {
    echo -e "${YELLOW}清理 .next 目录...${NC}"
    if [ -d ".next" ]; then
        rm -rf .next
        echo -e "${GREEN}✓ .next 目录已删除${NC}"
    else
        echo -e "${GREEN}✓ .next 目录不存在，跳过${NC}"
    fi
}

# Function to clean node_modules
clean_node_modules() {
    echo -e "${YELLOW}清理 node_modules 目录...${NC}"
    if [ -d "node_modules" ]; then
        rm -rf node_modules
        echo -e "${GREEN}✓ node_modules 目录已删除${NC}"
        echo -e "${YELLOW}重新安装依赖...${NC}"
        npm install
        echo -e "${GREEN}✓ 依赖安装完成${NC}"
    else
        echo -e "${GREEN}✓ node_modules 目录不存在，跳过${NC}"
    fi
}

# Function to full restart
full_restart() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${GREEN}  执行完整重启流程${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""

    kill_port_3000
    kill_next_processes
    clean_next_dir

    echo ""
    echo -e "${GREEN}启动开发服务器...${NC}"
    npm run dev
}

# Display menu
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}  Kiro Travel 项目启动菜单${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}开发模式:${NC}"
echo "  1) 开发服务器 (npm run dev)"
echo "  2) 完整重启 (清理 + 重启) ⭐ 推荐"
echo ""
echo -e "${YELLOW}生产模式:${NC}"
echo "  3) 构建项�� (npm run build)"
echo "  4) 启动生产服务器 (npm run start)"
echo "  5) 构建并启动生产服务器"
echo ""
echo -e "${YELLOW}清理选项:${NC}"
echo "  6) 清理 .next 目录"
echo "  7) 清理 node_modules 并重装"
echo "  8) 清理端口 3000 占用"
echo "  9) 清理所有 Next.js 进程"
echo ""
echo -e "${YELLOW}数据库:${NC}"
echo " 10) 初始化数据库"
echo " 11) 重置数据库 (删除并重建)"
echo ""
echo -e "${YELLOW}其他:${NC}"
echo " 12) 代码检查 (lint)"
echo " 13) 类型检查 (tsc)"
echo "  0) 退出"
echo ""
echo -e "${BLUE}========================================${NC}"

# Read user input with default value
read -p "请输入序号 (默认: 2): " choice
choice=${choice:-2}

# Execute corresponding command
case $choice in
    1)
        echo -e "${GREEN}启动开发服务器...${NC}"
        npm run dev
        ;;
    2)
        full_restart
        ;;
    3)
        echo -e "${GREEN}���建生产版本...${NC}"
        npm run build
        ;;
    4)
        echo -e "${GREEN}启动生产服务器...${NC}"
        npm run start
        ;;
    5)
        echo -e "${GREEN}构建并启动生产服务器...${NC}"
        npm run build && npm run start
        ;;
    6)
        clean_next_dir
        ;;
    7)
        clean_node_modules
        ;;
    8)
        kill_port_3000
        ;;
    9)
        kill_next_processes
        ;;
    10)
        echo -e "${GREEN}初始化数据库...${NC}"
        sqlite3 data/travel.db < scripts/001_create_tables_sqlite.sql
        echo -e "${GREEN}✓ 数据库初始化完成${NC}"
        ;;
    11)
        echo -e "${YELLOW}重置数据库 (删除并重建)...${NC}"
        rm -f data/travel.db data/travel.db-shm data/travel.db-wal
        sqlite3 data/travel.db < scripts/001_create_tables_sqlite.sql
        if [ -f "scripts/002_insert_test_data.sql" ]; then
            sqlite3 data/travel.db < scripts/002_insert_test_data.sql
            echo -e "${GREEN}✓ 测试数据已插入${NC}"
        fi
        echo -e "${GREEN}✓ 数据库重置完成${NC}"
        ;;
    12)
        echo -e "${GREEN}执行代码检查...${NC}"
        npm run lint
        ;;
    13)
        echo -e "${GREEN}执行类型检查...${NC}"
        npx tsc --noEmit
        ;;
    0)
        echo -e "${GREEN}退出脚本${NC}"
        exit 0
        ;;
    *)
        echo -e "${RED}无效选择！${NC}"
        echo -e "${YELLOW}默认执行完整重启...${NC}"
        full_restart
        ;;
esac
