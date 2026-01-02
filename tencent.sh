#!/bin/bash

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# 打印函数
print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_header() {
    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC}  $1"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BIN_DIR="$SCRIPT_DIR/bin"

# 执行脚本
run_script() {
    local script_name=$1
    if [ -f "$BIN_DIR/$script_name" ]; then
        chmod +x "$BIN_DIR/$script_name"
        print_info "正在执行: $script_name"
        cd "$BIN_DIR"
        ./"$script_name"
        cd "$SCRIPT_DIR"
    else
        echo -e "${RED}错误: 脚本 $script_name 未在 bin/ 目录下找到${NC}"
    fi
}

# 显示菜单
show_menu() {
    clear
    echo -e "${PURPLE}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}  Kiro Travel - 腾讯云部署工具${NC}"
    echo -e "${PURPLE}═══════════════════════════════════════════════════════════${NC}"
    echo ""

    echo -e "${GREEN}  1.${NC} 🚀 ${BLUE}部署到腾讯云${NC}"
    echo -e "     ${PURPLE}→${NC} 构建并部署 Next.js 应用（使用 PM2）"
    echo ""

    echo -e "${GREEN}  2.${NC} 🔄 ${BLUE}重启服务${NC}"
    echo -e "     ${PURPLE}→${NC} 重启 PM2 进程和 Nginx"
    echo ""

    echo -e "${GREEN}  3.${NC} 🗄️  ${BLUE}初始化数据库（远程）${NC}"
    echo -e "     ${PURPLE}→${NC} 远程执行数据库初始化脚本"
    echo ""

    echo -e "${PURPLE}═══════════════════════════════════════════════════════════${NC}"
    echo ""

    echo -e "${GREEN}  9.${NC} 🚪 ${BLUE}退出${NC}"
    echo ""
    echo -e "${PURPLE}═══════════════════════════════════════════════════════════${NC}"
    echo ""
}

# 主循环
while true; do
    show_menu
    echo -ne "${YELLOW}请选择操作 [1-3, 9]: ${NC}"
    read -r choice
    case $choice in
        1)
            print_header "执行: 部署到腾讯云"
            run_script "tencent-deploy.sh"
            ;;
        2)
            print_header "执行: 重启服务"
            run_script "tencent-restart.sh"
            ;;
        3)
            print_header "执行: 初始化数据库（远程）"
            run_script "tencent-init-db.sh"
            ;;
        9)
            echo "再见!"
            exit 0
            ;;
        *)
            echo -e "${RED}无效的选项${NC}"
            ;;
    esac
    echo ""
    echo -ne "${YELLOW}按 Enter 键返回主菜单...${NC}"
    read -r
done
