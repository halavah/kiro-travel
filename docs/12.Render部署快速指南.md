# Render.com 部署快速指南

> **适用项目**：kiro-travel Next.js 16 + SQLite
>
> **部署时间**：10-15 分钟
>
> **技术要求**：无需 Docker，无需命令行

---

## 📋 准备工作

### 1. 确认项目配置

确保你的项目有以下文件：

- ✅ `package.json` - 包含 `build` 和 `start` 脚本
- ✅ `next.config.mjs` - Next.js 配置
- ✅ `.env.example` - 环境变量模板
- ✅ SQLite 数据库代码（better-sqlite3 或 sqlite3）

### 2. GitHub 仓库

确保代码已推送到 GitHub 仓库。

---

## 🚀 部署步骤

### 第一步：注册 Render 账号

1. 访问 [render.com](https://render.com/)
2. 点击 "Get Started for Free"
3. 使用 GitHub 账号登录（推荐）或邮箱注册

### 第二步：创建 Web Service

1. 登录后点击 "New +" → "Web Service"
2. 选择 "Connect a repository"
3. 授权 Render 访问你的 GitHub
4. 在列表中找到 `kiro-travel` 仓库，点击 "Connect"

### 第三步：配置服务

填写以下配置：

| 配置项 | 值 | 说明 |
|--------|-----|------|
| **Name** | `kiro-travel` | 服务名称（会成为 URL 的一部分） |
| **Region** | `Oregon (US West)` 或 `Singapore` | 选择离你近的区域 |
| **Branch** | `master` 或 `main` | 部署分支 |
| **Root Directory** | (留空) | 如果项目在根目录 |
| **Environment** | `Node` | 运行环境 |
| **Build Command** | `npm install && npm run build` | 构建命令 |
| **Start Command** | `npm start` | 启动命令 |
| **Instance Type** | `Free` | 免费实例 |

### 第四步：配置持久化存储（重要！）

为了防止数据库数据丢失，必须配置持久化磁盘：

1. 在配置页面向下滚动，找到 "Disks" 部分
2. 点击 "Add Disk"
3. 配置��下：
   - **Name**: `data`
   - **Mount Path**: `/data`
   - **Size**: `1 GB`（免费）
4. 点击 "Save"

⚠️ **重要**：部署后需要修改代码，让数据库文件保存到 `/data` 目录。

### 第五步：配置环境变量

1. 在配置页面向下滚动，找到 "Environment Variables" 部分
2. 点击 "Add Environment Variable"
3. 添加以下变量：

```env
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-here-change-this
NEXT_PUBLIC_APP_URL=https://kiro-travel.onrender.com
DATABASE_PATH=/data/travel.db
```

⚠️ **注意**：
- `JWT_SECRET` 必须修改为你自己的随机字符串
- `NEXT_PUBLIC_APP_URL` 中的域名替换为你的 Render 服务域名
- `DATABASE_PATH` 指向持久化磁盘路径

### 第六步：开始部署

1. 检查所有配置无误
2. 点击页面底部的 "Create Web Service"
3. Render 会自动开始构建和部署

**构建过程**：
- 克隆代码：~30 秒
- 安装依赖：2-5 分钟
- 构建项目：3-5 分钟
- 启动服务：~30 秒

**总耗时**：�� 6-11 分钟

---

## 🔧 代码调整（必须！）

部署成功后，需要修改代码以使用持久化磁盘。

### 修改数据库路径

找到你的数据库初始化代码，通常在 `lib/db.ts` 或类似文件：

#### 修改前：
```typescript
import Database from 'better-sqlite3';

const db = new Database('./travel.db');
```

#### 修改后：
```typescript
import Database from 'better-sqlite3';

const dbPath = process.env.DATABASE_PATH || './travel.db';
const db = new Database(dbPath);
```

### 更新 `.env.example`

```env
# 数据库配置
DATABASE_PATH=/data/travel.db  # Render 上使用，本地可以不设置
```

### 提交代码并重新部署

```bash
git add .
git commit -m "配置 Render 持久化存储路径"
git push
```

Render 会自动检测到代码变更并重新部署。

---

## ✅ 验证部署

### 1. 检查服务状态

在 Render Dashboard 中：
- "Status" 显示为 "Live" 🟢
- "Last Deploy" 显示最近的部署时间
- "Logs" 中无错误信息

### 2. 访问网站

点击 Render Dashboard 中的服务 URL（类似 `https://kiro-travel.onrender.com`）

**首次访问**：
- 如果服务处于休眠状态，需要等待 30-60 秒唤醒
- 页面显示加载动画

**正常运行**：
- 网站正常打开
- 可以浏览页面
- 数据库操作正常

### 3. 测试数据持久性

1. 在网站上��建一些测试数据（如添加行程）
2. 在 Render Dashboard 中手动触发重新部署：
   - 点击 "Manual Deploy" → "Deploy latest commit"
3. 等待部署完成，再次访问网站
4. 检查之前创建的数据是否还在

✅ 如果数据还在，说明持久化配置成功！

---

## 🛠️ render.yaml 配置文件（可选）

为了更好地管理配置，可以在项目根目录创建 `render.yaml`：

```yaml
services:
  - type: web
    name: kiro-travel
    env: node
    region: oregon
    plan: free
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_PATH
        value: /data/travel.db
      - key: JWT_SECRET
        generateValue: true  # Render 自动生成随机值
      - key: NEXT_PUBLIC_APP_URL
        sync: false  # 需要在 Dashboard 中手动设置
    disk:
      name: data
      mountPath: /data
      sizeGB: 1
```

**使用方式**：
1. 将上述内容保存为项目根目录的 `render.yaml`
2. 提交到 Git 仓库
3. 在 Render 中创建服务时选择 "Use render.yaml"

**优点**：
- 配置即代码，易于版本管理
- 团队协作更方便
- 可以一键创建多个环境（开发/生产）

---

## 🔄 避免自动休眠（可选）

Render 免费实例会在 15 分钟无请求后自动休眠。如果需要保持服务一直运行：

### 方案一：使用 UptimeRobot（推荐）

1. 访问 [uptimerobot.com](https://uptimerobot.com/)
2. 注册免费账号
3. 添加监控：
   - **Monitor Type**: HTTP(s)
   - **Friendly Name**: Kiro Travel
   - **URL**: `https://kiro-travel.onrender.com`
   - **Monitoring Interval**: 5 minutes
4. 保存

**效果**：UptimeRobot 每 5 分钟访问一次你的网站，避免休眠。

### 方案二：使用 Cron-job.org

1. 访问 [cron-job.org](https://cron-job.org/)
2. 注册免费账号
3. 创建 Cron Job：
   - **URL**: `https://kiro-travel.onrender.com/api/health`
   - **Interval**: Every 5 minutes
4. 保存

### 方案三：GitHub Actions（适合开发者）

创建 `.github/workflows/keep-alive.yml`：

```yaml
name: Keep Render Service Alive

on:
  schedule:
    - cron: '*/5 * * * *'  # 每 5 分钟运行一次
  workflow_dispatch:  # 允许手动触发

jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping Render Service
        run: |
          curl -f https://kiro-travel.onrender.com || echo "Service is waking up..."
```

⚠️ **注意**：这种方式会消耗 GitHub Actions 的免费配额。

---

## 📊 监控和日志

### 查看实时日志

1. 进入 Render Dashboard
2. 点击你的服务名称
3. 切换到 "Logs" 标签
4. 实时查看应用日志

**常用日志命令**：
- 搜索错误：在日志中搜索 "error" 或 "ERROR"
- 查看数据库操作：搜索 "SQL" 或 "database"
- 监控请求：搜索 "GET" 或 "POST"

### 性能指标

在 "Metrics" 标签中可以查看：
- CPU 使用率
- 内存使用量
- 请求响应时间
- 网络流量

### 设置告警

1. 在 Dashboard 中点击 "Settings"
2. 找到 "Notifications" 部分
3. 添加邮箱或 Slack webhook
4. 选择告警条件：
   - 部署失败
   - 服务宕机
   - 资源超限

---

## 🐛 常见问题排查

### 问题 1：部署失败 - "Build failed"

**可能原因**：
- Node.js 版本不匹配
- 依赖安装失败
- 构建命令错误

**解决方案**：
1. 检查 `package.json` 中的 `engines` 字段：
   ```json
   "engines": {
     "node": ">=18.0.0"
   }
   ```
2. 在 Render Dashboard 中指定 Node 版本：
   - Environment Variables 添加 `NODE_VERSION=18.17.0`
3. 检查构建日志，查找具体错误

### 问题 2：服务启动失败 - "Start command failed"

**可能原因**：
- 启动命令错误
- 端口配置问题
- 环境变量缺失

**解决方案**：
1. 确认 `package.json` 中的 `start` 脚本正确：
   ```json
   "scripts": {
     "start": "next start"
   }
   ```
2. Next.js 会自动使用 Render 提供的 `PORT` 环境变量
3. 检查必需的环境变量��否都已设置

### 问题 3：数据库数据丢失

**可能原因**：
- 未配置持久化磁盘
- 数据库路径未指向 `/data` 目录

**解决方案**：
1. 确认已添加 Disk（在 Settings → Disks）
2. 确认代码中使用了 `DATABASE_PATH` 环境变量
3. 检查日志中数据库文件的实际路径：
   ```typescript
   console.log('Database path:', dbPath);
   ```

### 问题 4：访问速度慢

**可能原因**：
- 服务处于休眠状态（冷启动）
- 区域选择不当
- 免费实例资源限制

**解决方案**：
1. 使用 UptimeRobot 避免休眠
2. 在 Settings 中更改 Region 到离用户更近的位置
3. 优化代码，减少数据库查询

### 问题 5：better-sqlite3 编译错误

**错误信息**：
```
Error: Cannot find module 'better-sqlite3'
```

**解决方案**：
1. 确保 `better-sqlite3` 在 `dependencies` 而不是 `devDependencies`：
   ```json
   "dependencies": {
     "better-sqlite3": "^12.5.0"
   }
   ```
2. 在 Render 中添加环境变量：
   ```
   PYTHON_VERSION=3.11
   ```
3. 如果仍然失败，考虑切换到 `sqlite3` 包

---

## 🔐 安全配置

### 1. 环境变量安全

❌ 不要将敏感信息提交到 Git：
```bash
# .gitignore
.env
.env.local
.env.production
```

✅ 在 Render Dashboard 中设置环境变量

### 2. JWT Secret 生成

生成强随机密钥：
```bash
# 在本地终端运行
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

将输出的字符串设置为 `JWT_SECRET`

### 3. 数据库备份

定期备份数据库：
1. 在 Render Dashboard 中进入 Shell：
   - 点击服务 → "Shell" 标签
2. 运行备份命令：
   ```bash
   cp /data/travel.db /tmp/backup-$(date +%Y%m%d).db
   ```
3. 或者使用 SSH 下载：
   ```bash
   # 在本地运行
   render ssh kiro-travel
   cp /data/travel.db ~/backup.db
   exit
   ```

---

## 📈 性能优化建议

### 1. 减少冷启动时间

在 `package.json` 中优化依赖：
```json
{
  "dependencies": {
    // 只保留生产环境必需的依赖
  },
  "devDependencies": {
    // 将开发工具放这里
  }
}
```

### 2. 优化构建大小

在 `next.config.mjs` 中：
```javascript
const nextConfig = {
  output: 'standalone',  // 减小部署包大小
  compress: true,         // 启用 gzip 压缩
  poweredByHeader: false, // 移除 X-Powered-By 头
}
```

### 3. 数据库优化

```typescript
// 添加索引
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id);
  CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
`);

// 使用预编译语句
const stmt = db.prepare('SELECT * FROM tickets WHERE user_id = ?');
```

---

## 🎓 进阶配置

### 自定义域名

1. 在 Render Dashboard 中点击 "Settings"
2. 找到 "Custom Domains" 部分
3. 点击 "Add Custom Domain"
4. 输入你的域名（如 `travel.example.com`）
5. 在你的域名 DNS 设置中添加 CNAME 记录：
   ```
   travel.example.com CNAME kiro-travel.onrender.com
   ```
6. 等待 DNS 传播（通常 5-30 分钟）
7. Render 自动配置 HTTPS 证书

### 多环境部署

创建 `render.yaml` 支持多环境：

```yaml
services:
  # 生产环境
  - type: web
    name: kiro-travel-prod
    env: node
    branch: main
    envVars:
      - key: NODE_ENV
        value: production

  # 开发环境
  - type: web
    name: kiro-travel-dev
    env: node
    branch: develop
    envVars:
      - key: NODE_ENV
        value: development
```

### Pull Request 预览

Render 支持自动为每个 PR 创建预览环境：

1. 在 Settings 中启用 "Pull Request Previews"
2. 每次创�� PR，Render 自动部署预览版本
3. PR 合并后自动删除预览环境

---

## 📚 资源链接

### 官方文档
- [Render 官方文档](https://render.com/docs)
- [Render Node.js 部署指南](https://render.com/docs/deploy-node-express-app)
- [Render 持久化磁盘文档](https://render.com/docs/disks)
- [render.yaml 参考](https://render.com/docs/yaml-spec)

### 社区资源
- [Render 社区论坛](https://community.render.com/)
- [Render 状态页面](https://status.render.com/)
- [Render Blog](https://render.com/blog)

### 对比和评测
- [Render Free Tier 详解](https://www.freetiers.com/directory/render)
- [Render vs Vercel vs Netlify](https://www.freetiers.com/blog/render-vs-railway-comparison)

---

## ✅ 部署检查清单

### 部署前
- [ ] 代码已推送到 GitHub
- [ ] `package.json` 包含 `build` 和 `start` 脚本
- [ ] 测试本地构建：`npm run build && npm start`
- [ ] 准备好所有环境变量值
- [ ] 确认数据库路径配置正确

### 部署中
- [ ] Render 账号已注册
- [ ] GitHub 仓库已连接
- [ ] 构建和启动命令正确
- [ ] 持久化磁盘已配置
- [ ] 环境变量已设置
- [ ] 选择了合适的区域

### 部署后
- [ ] 服务状态为 "Live"
- [ ] 网站可以正常访问
- [ ] 数据库操作正常
- [ ] 测试数据持久性
- [ ] 配置监控（UptimeRobot）
- [ ] 设置告警通知

---

## 🎉 总结

Render.com 是部署 Next.js + SQLite 项目的最佳免费选择：

✅ **优点**：
- 零代码修改（原生支持 SQLite）
- 完全免费（永久）
- 配置简单（10 分钟完成）
- 持久化存储（数据不丢失）
- 自动 HTTPS
- Git 集成自动部署

⚠️ **注意事项**：
- 15 分钟无访问自动休眠（可用监控服务解决）
- 冷启动需要 30-60 秒
- 免费实例资源有限（适合演示和低流量）

**下一步**：开始部署吧！如果遇到任何问题，参考上面的"常见问题排查"章节。
