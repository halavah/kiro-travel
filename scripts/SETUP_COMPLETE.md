# 🎉 自动化设置完成！

## ✅ 已完成的操作

1. ✓ 自动打开了 Supabase SQL Editor
2. ✓ 生成了合并的 SQL 文件 (`scripts/combined_setup.sql`)
3. ✓ **SQL 内容已复制到你的剪贴板！**

## 📝 现在只需 3 步：

### 步骤 1: 在 Supabase SQL Editor 中
浏览器应该已经打开了这个页面：
```
https://supabase.com/dashboard/project/fxkapbshupsglaowykns/sql/new
```

### 步骤 2: 粘贴 SQL
在 SQL Editor 中：
- 按 **Cmd+V** (Mac) 或 **Ctrl+V** (Windows/Linux)
- SQL 代码会自动粘贴进去（558 行）

### 步骤 3: 执行
- 点击右下角的 **"Run"** 按钮
- 或按 **Cmd+Enter** (Mac) / **Ctrl+Enter** (Windows/Linux)
- 等待执行完成（约 10-30 秒）

## 🔍 验证数据库

执行完成后，运行以下命令验证：

```bash
npm run db:check
```

或者：

```bash
node scripts/auto-setup.mjs
```

如果看到 "✅ 数据库已完全初始化" 就说明成功了！

## 📊 查看数据

执行成功后，你可以在这里查看数据表：

```
https://supabase.com/dashboard/project/fxkapbshupsglaowykns/editor
```

应该能看到 **15 张表**：
- profiles
- spot_categories
- spots
- spot_comments
- spot_favorites
- spot_likes
- tickets
- cart_items
- orders
- order_items
- hotels
- hotel_rooms
- hotel_bookings
- activities
- news

## 🚀 启动项目

数据库设置完成后：

```bash
npm run dev
```

然后访问：http://localhost:3000

## 🛠️ 可用命令

```bash
# 一键设置助手（会打开浏览器并复制 SQL）
npm run db:easy

# 或
npm run db:init
npm run db:setup

# 检查数据库状态
npm run db:check

# 启动开发服务器
npm run dev
```

## ❓ 如果遇到问题

### 问题 1: 浏览器没有自动打开

手动访问：
```
https://supabase.com/dashboard/project/fxkapbshupsglaowykns/sql/new
```

### 问题 2: SQL 没有复制到剪贴板

手动复制文件内容：
```bash
cat scripts/combined_setup.sql
```

然后全选复制（Cmd+A, Cmd+C）

### 问题 3: 执行 SQL 时报错

- 确保你是项目的 Owner
- 查看具体错误信息
- 如果是 "already exists"，说明表已经存在，可以忽略
- 如果有其他错误，可以尝试分步执行（方案 B）

### 问题 4: 想分步执行（更安全）

依次执行以下 4 个文件：
```bash
# 复制并在 SQL Editor 中执行
cat scripts/001_create_tables.sql    # 创建表
cat scripts/002_enable_rls.sql       # 启用安全策略
cat scripts/003_create_triggers.sql  # 创建触发器
cat scripts/004_seed_data.sql        # 插入示例数据
```

## 📚 相关文档

- [QUICK_START.md](../docs/QUICK_START.md) - 详细的手动设置指南
- [DATABASE_SCHEMA.md](../docs/DATABASE_SCHEMA.md) - 数据库结构说明
- [API_DOCUMENTATION.md](../docs/API_DOCUMENTATION.md) - API 文档

## 💡 提示

- **首次设置**: 使用 `npm run db:easy`
- **检查状态**: 使用 `npm run db:check`
- **查看数据**: 访问 Supabase Table Editor
- **开始开发**: `npm run dev`

---

**祝开发顺利！** 🎉
