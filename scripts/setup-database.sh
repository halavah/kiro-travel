#!/bin/bash

# Supabase 数据库初始化脚本
# 使用方法: ./scripts/setup-database.sh

set -e

echo "🚀 开始设置 Supabase 数据库..."
echo ""

# 检查是否安装了 supabase CLI
if ! command -v supabase &> /dev/null; then
    echo "❌ 错误: Supabase CLI 未安装"
    echo ""
    echo "请先安装 Supabase CLI:"
    echo "  macOS: brew install supabase/tap/supabase"
    echo "  Linux: brew install supabase/tap/supabase"
    echo "  Windows: scoop install supabase"
    echo ""
    echo "或者使用 Web 控制台手动导入 SQL 文件"
    echo "详见: SUPABASE_SETUP.md"
    exit 1
fi

# 检查环境变量
if [ ! -f .env.local ]; then
    echo "❌ 错误: .env.local 文件不存在"
    echo "请先创建 .env.local 文件并配置 Supabase 连接信息"
    exit 1
fi

# 提示用户确认
echo "⚠️  警告: 此操作将在你的 Supabase 数据库中创建表和数据"
echo ""
read -p "是否继续? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ 操作已取消"
    exit 1
fi

echo ""
echo "📦 步骤 1/4: 创建表结构..."
supabase db execute -f scripts/001_create_tables.sql
echo "✅ 表结构创建完成"
echo ""

echo "🔒 步骤 2/4: 启用行级安全 (RLS)..."
supabase db execute -f scripts/002_enable_rls.sql
echo "✅ RLS 策略已启用"
echo ""

echo "⚡ 步骤 3/4: 创建触发器..."
supabase db execute -f scripts/003_create_triggers.sql
echo "✅ 触发器创建完成"
echo ""

echo "🌱 步骤 4/4: 插入示例数据..."
supabase db execute -f scripts/004_seed_data.sql
echo "✅ 示例数据插入完成"
echo ""

echo "🎉 数据库设置完成！"
echo ""
echo "下一步:"
echo "  1. 确保 .env.local 中的环境变量正确"
echo "  2. 运行 'npm run dev' 或 'pnpm dev' 启动开发服务器"
echo "  3. 访问 http://localhost:3000"
echo ""
