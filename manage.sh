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
echo "  3) 构建项目 (npm run build)"
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
echo " 10) 初始化数据库 (创建表+测试数据+FTS索引)"
echo " 11) 重置数据库 (删除并重建)"
echo " 12) 查看数据统计"
echo " 13) 设置全文搜索索引 (FTS5)"
echo ""
echo -e "${YELLOW}其他:${NC}"
echo " 14) 代码检查 (lint)"
echo " 15) 类型检查 (tsc)"
echo ""
echo -e "${YELLOW}部署:${NC}"
echo "  0) 部署 (deploy) - Git 提交并推送"
echo ""
echo " 99) 退出"
echo ""
echo -e "${BLUE}========================================${NC}"

# Read user input with default value
read -p "请输入序号 (默认: 0): " choice
choice=${choice:-0}

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
        echo -e "${GREEN}构建生产版本...${NC}"
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
        echo -e "${GREEN}初始化数据库 (包含 FTS5 索引)...${NC}"
        npm run db:init
        ;;
    11)
        echo -e "${RED}警告: 这将删除所有数据！${NC}"
        read -p "确认重置数据库? (y/N): " confirm
        if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
            echo -e "${GREEN}重置数据库...${NC}"
            npm run db:reset
        else
            echo -e "${YELLOW}操作已取消${NC}"
        fi
        ;;
    12)
        echo -e "${GREEN}查看数据统计...${NC}"
        if [ -f "data/travel.db" ]; then
            sqlite3 data/travel.db << 'EOF'
.headers on
.mode column
.width 20 10
SELECT '用户数' as 统计项, COUNT(*) as 数量 FROM users
UNION ALL
SELECT '景点分类数', COUNT(*) FROM spot_categories
UNION ALL
SELECT '景点数', COUNT(*) FROM spots
UNION ALL
SELECT '门票数', COUNT(*) FROM tickets
UNION ALL
SELECT '酒店数', COUNT(*) FROM hotels
UNION ALL
SELECT '酒店房间数', COUNT(*) FROM hotel_rooms
UNION ALL
SELECT '订单数', COUNT(*) FROM orders
UNION ALL
SELECT '评论数', COUNT(*) FROM spot_comments
UNION ALL
SELECT '活动数', COUNT(*) FROM activities
UNION ALL
SELECT '新闻数', COUNT(*) FROM news;
EOF
            echo ""
            echo -e "${GREEN}✓ 数据统计完成${NC}"
        else
            echo -e "${RED}数据库文件不存在，请先运行 '初始化数据库'${NC}"
        fi
        ;;
    13)
        echo -e "${GREEN}设置全文搜索索引 (FTS5)...${NC}"
        npm run db:fts
        ;;
    14)
        echo -e "${GREEN}执行代码检查...${NC}"
        npm run lint
        ;;
    15)
        echo -e "${GREEN}执行类型检查...${NC}"
        npx tsc --noEmit
        ;;
    0)
        echo -e "${BLUE}========================================${NC}"
        echo -e "${GREEN}  Git 部署流程${NC}"
        echo -e "${BLUE}========================================${NC}"
        echo ""

        # Get current branch name
        echo -e "${YELLOW}检测当前 Git 分支...${NC}"
        current_branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
        if [ -z "$current_branch" ]; then
            echo -e "${RED}未能检测到 Git 分支。${NC}"
            echo -e "${RED}请确保当前目录是 Git 仓库。${NC}"
            exit 1
        fi
        echo -e "${GREEN}当前分支: $current_branch${NC}"
        echo ""

        # Stage all changes first
        echo -e "${YELLOW}暂存所有更改...${NC}"
        git add .
        if [ $? -ne 0 ]; then
            echo -e "${RED}暂存失败。${NC}"
            exit 1
        fi

        # Check if there are changes to commit
        git diff --staged --quiet
        if [ $? -eq 0 ]; then
            echo -e "${YELLOW}没有需要提交的更改。${NC}"
            echo ""
            echo -e "${YELLOW}拉取远程最新更改...${NC}"
            git pull origin "$current_branch"
            exit 0
        fi

        # Commit changes with timestamped message
        timestamp=$(date +"%Y%m%d_%H%M%S")
        echo -e "${YELLOW}提交更改，时间戳: $timestamp...${NC}"
        git commit -m "$timestamp"
        if [ $? -ne 0 ]; then
            echo -e "${RED}提交失败。${NC}"
            exit 1
        fi

        # Pull latest changes from the remote repository
        echo -e "${YELLOW}拉取远程最新更改...${NC}"
        git pull origin "$current_branch"
        if [ $? -ne 0 ]; then
            echo -e "${RED}拉取失败。如有冲突请解决后重新运行。${NC}"
            exit 1
        fi

        # Push changes to the repository
        echo -e "${YELLOW}推送更改到远程仓库...${NC}"
        git push origin "$current_branch"
        if [ $? -ne 0 ]; then
            echo -e "${RED}推送失败。${NC}"
            exit 1
        fi

        echo ""
        echo -e "${GREEN}✓ 更改已成功提交并推送到分支: $current_branch${NC}"
        ;;
    99)
        echo -e "${GREEN}退出脚本${NC}"
        exit 0
        ;;
    *)
        echo -e "${RED}无效选择！${NC}"
        echo -e "${YELLOW}默认执行部署...${NC}"
        # Execute deploy (same as option 0)
        echo -e "${BLUE}========================================${NC}"
        echo -e "${GREEN}  Git 部署流程${NC}"
        echo -e "${BLUE}========================================${NC}"
        echo ""

        # Get current branch name
        echo -e "${YELLOW}检测当前 Git 分支...${NC}"
        current_branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
        if [ -z "$current_branch" ]; then
            echo -e "${RED}未能检测到 Git 分支。${NC}"
            echo -e "${RED}请确保当前目录是 Git 仓库。${NC}"
            exit 1
        fi
        echo -e "${GREEN}当前分支: $current_branch${NC}"
        echo ""

        # Stage all changes first
        echo -e "${YELLOW}暂存所有更改...${NC}"
        git add .
        if [ $? -ne 0 ]; then
            echo -e "${RED}暂存失败。${NC}"
            exit 1
        fi

        # Check if there are changes to commit
        git diff --staged --quiet
        if [ $? -eq 0 ]; then
            echo -e "${YELLOW}没有需要提交的更改。${NC}"
            echo ""
            echo -e "${YELLOW}拉取远程最新更改...${NC}"
            git pull origin "$current_branch"
            exit 0
        fi

        # Commit changes with timestamped message
        timestamp=$(date +"%Y%m%d_%H%M%S")
        echo -e "${YELLOW}提交更改，时间戳: $timestamp...${NC}"
        git commit -m "$timestamp"
        if [ $? -ne 0 ]; then
            echo -e "${RED}提交失败。${NC}"
            exit 1
        fi

        # Pull latest changes from the remote repository
        echo -e "${YELLOW}拉取远程最新更改...${NC}"
        git pull origin "$current_branch"
        if [ $? -ne 0 ]; then
            echo -e "${RED}拉取失败。如有冲突请解决后重新运行。${NC}"
            exit 1
        fi

        # Push changes to the repository
        echo -e "${YELLOW}推送更改到远程仓库...${NC}"
        git push origin "$current_branch"
        if [ $? -ne 0 ]; then
            echo -e "${RED}推送失败。${NC}"
            exit 1
        fi

        echo ""
        echo -e "${GREEN}✓ 更改已成功提交并推送到分支: $current_branch${NC}"
        ;;
esac
