#!/bin/bash

# Vercel 部署前检查脚本
# 运行此脚本以确保所有配置正确

echo "🔍 Vercel 部署前检查..."
echo "================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查计数器
PASSED=0
FAILED=0
WARNINGS=0

# 检查函数
check_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASSED++))
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAILED++))
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARNINGS++))
}

echo "📦 检查配置文件..."
echo "--------------------------------"

# 检查 vercel.json
if [ -f "vercel.json" ]; then
    check_pass "vercel.json 存在"
else
    check_fail "vercel.json 不存在"
fi

# 检查 .vercelignore
if [ -f ".vercelignore" ]; then
    check_pass ".vercelignore 存在"
else
    check_warn ".vercelignore 不存在（可选）"
fi

# 检查 .env.example
if [ -f ".env.example" ]; then
    check_pass ".env.example 存在"
else
    check_warn ".env.example 不存在（建议创建）"
fi

# 检查 package.json
if [ -f "package.json" ]; then
    check_pass "package.json 存在"
else
    check_fail "package.json 不存在"
fi

# 检查 next.config.mjs
if [ -f "next.config.mjs" ] || [ -f "next.config.js" ]; then
    check_pass "Next.js 配置文件存在"
else
    check_fail "Next.js 配置文件不存在"
fi

echo ""
echo "🔐 检查环境变量..."
echo "--------------------------------"

# 检查 .env.local
if [ -f ".env.local" ]; then
    check_pass ".env.local 存在"

    # 检查 JWT_SECRET
    if grep -q "JWT_SECRET=" .env.local; then
        JWT_SECRET=$(grep "JWT_SECRET=" .env.local | cut -d'=' -f2)
        if [ "$JWT_SECRET" = "your-secret-key-change-in-production" ]; then
            check_fail "JWT_SECRET 使用默认值，请修改为强密钥"
        else
            check_pass "JWT_SECRET 已自定义"
        fi
    else
        check_fail "JWT_SECRET 未在 .env.local 中定义"
    fi
else
    check_warn ".env.local 不存在（本地开发需要）"
fi

echo ""
echo "📂 检查 .gitignore..."
echo "--------------------------------"

if [ -f ".gitignore" ]; then
    check_pass ".gitignore 存在"

    # 检查是否忽略 .env.local
    if grep -q ".env.local" .gitignore || grep -q ".env*.local" .gitignore; then
        check_pass ".gitignore 包含 .env.local"
    else
        check_fail ".gitignore 未包含 .env.local"
    fi

    # 检查是否忽略数据库文件
    if grep -q "*.db" .gitignore || grep -q "*.sqlite" .gitignore; then
        check_pass ".gitignore 包含数据库文件"
    else
        check_warn ".gitignore 未包含数据库文件（建议添加）"
    fi

    # 检查是否忽略 .vercel
    if grep -q ".vercel" .gitignore; then
        check_pass ".gitignore 包含 .vercel 目录"
    else
        check_warn ".gitignore 未包含 .vercel 目录（建议添加）"
    fi
else
    check_fail ".gitignore 不存在"
fi

echo ""
echo "🏗️  检查构建配置..."
echo "--------------------------------"

# 检查 package.json 中的脚本
if [ -f "package.json" ]; then
    if grep -q '"build"' package.json; then
        check_pass "package.json 包含 build 脚本"
    else
        check_fail "package.json 缺少 build 脚本"
    fi

    if grep -q '"start"' package.json; then
        check_pass "package.json 包含 start 脚本"
    else
        check_fail "package.json 缺少 start 脚本"
    fi
fi

echo ""
echo "📚 检查文档..."
echo "--------------------------------"

if [ -f "VERCEL_DEPLOYMENT.md" ]; then
    check_pass "VERCEL_DEPLOYMENT.md 存在"
else
    check_warn "VERCEL_DEPLOYMENT.md 不存在（建议创建）"
fi

if [ -f "VERCEL_QUICKSTART.md" ]; then
    check_pass "VERCEL_QUICKSTART.md 存在"
else
    check_warn "VERCEL_QUICKSTART.md 不存在（建议创建）"
fi

if [ -f "DEPLOYMENT_CHECKLIST.md" ]; then
    check_pass "DEPLOYMENT_CHECKLIST.md 存在"
else
    check_warn "DEPLOYMENT_CHECKLIST.md 不存在（建议创建）"
fi

echo ""
echo "🔄 检查 Git 状态..."
echo "--------------------------------"

# 检查是否是 Git 仓库
if [ -d ".git" ]; then
    check_pass "Git 仓库已初始化"

    # 检查是否有未提交的更改
    if [ -n "$(git status --porcelain)" ]; then
        check_warn "有未提交的更改"
        echo "    运行 'git status' 查看详情"
    else
        check_pass "没有未提交的更改"
    fi

    # 检查远程仓库
    if git remote -v | grep -q "origin"; then
        check_pass "远程仓库已配置"
        REMOTE_URL=$(git remote get-url origin)
        echo "    远程 URL: $REMOTE_URL"
    else
        check_fail "未配置远程仓库"
    fi
else
    check_fail "不是 Git 仓库"
fi

echo ""
echo "🧪 测试本地构建..."
echo "--------------------------------"

echo "正在运行 'npm run build'..."
if npm run build > /dev/null 2>&1; then
    check_pass "本地构建成功"
else
    check_fail "本地构建失败"
    echo "    运行 'npm run build' 查看详细错误"
fi

echo ""
echo "================================"
echo "📊 检查结果汇总"
echo "================================"
echo -e "${GREEN}通过: $PASSED${NC}"
echo -e "${YELLOW}警告: $WARNINGS${NC}"
echo -e "${RED}失败: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ 所有关键检查都通过了！${NC}"
    echo "你可以继续部署到 Vercel。"
    echo ""
    echo "下一步："
    echo "1. 提交并推送代码到 GitHub"
    echo "   git add ."
    echo "   git commit -m 'feat: 准备 Vercel 部署'"
    echo "   git push origin master"
    echo ""
    echo "2. 访问 https://vercel.com 导入项目"
    echo ""
    echo "3. 配置环境变量（JWT_SECRET）"
    echo ""
    echo "4. 点击部署"
    exit 0
else
    echo -e "${RED}❌ 有 $FAILED 个关键检查失败${NC}"
    echo "请修复上述问题后再尝试部署。"
    echo ""
    echo "需要帮助？查看："
    echo "- DEPLOYMENT_CHECKLIST.md"
    echo "- VERCEL_DEPLOYMENT.md"
    exit 1
fi
