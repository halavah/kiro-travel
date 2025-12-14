# 🚀 Vercel 部署指南

本指南将帮助你将 Kiro Travel 项目部署到 Vercel 平台。

## ⚠️ 重要说明

由于本项目使用 **SQLite** 数据库，而 Vercel 的无服务器环境**不支持 SQLite 的写入操作**，因此有以下限制和解决方案：

### SQLite 在 Vercel 的限制
- ❌ 无法在 Vercel 上执行数据库写入操作（INSERT, UPDATE, DELETE）
- ❌ 数据��文件会在每次部署后重置
- ✅ 仅支持只读操作（适合静态/演示网站）

### 推荐解决方案

如果你需要完整的数据库功能，请选择以下云数据库服务之一：

1. **[Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)** ⭐ 推荐
2. **[Supabase](https://supabase.com/)** - PostgreSQL 云数据库
3. **[PlanetScale](https://planetscale.com/)** - MySQL 云数据库
4. **[Neon](https://neon.tech/)** - Serverless PostgreSQL
5. **[Turso](https://turso.tech/)** - SQLite 边缘数据库（支持分布式）

---

## 📋 部署前准备

### 1. 确保代码已推送到 Git 仓库

```bash
# 初始化 Git 仓库（如果还没有）
git init

# 添加所有文件
git add .

# 提交更改
git commit -m "feat: 准备 Vercel 部署"

# 推送到 GitHub（假设已创建远程仓库）
git remote add origin https://github.com/your-username/kiro-travel.git
git push -u origin master
```

### 2. 检查必要文件

确保以下文件已创建：
- ✅ `vercel.json` - Vercel 配置文件
- ✅ `.vercelignore` - 部署时忽略的文件
- ✅ `.env.example` - 环境变量示例

---

## 🚀 Vercel 部署步骤

### 方法一：通过 Vercel 网站部署（推荐）

1. **访问 [Vercel](https://vercel.com)**
   - 使用 GitHub 账号登录

2. **导入项目**
   - 点击 "Add New Project"
   - 选择 "Import Git Repository"
   - 授权 Vercel 访问你的 GitHub 仓库
   - 选择 `kiro-travel` 仓库

3. **配置项目**

   **Framework Preset:** Next.js

   **Root Directory:** `./` (项目根目录)

   **Build Command:**
   ```bash
   npm run build
   ```

   **Output Directory:** `.next`

   **Install Command:**
   ```bash
   npm install
   ```

4. **配置环境变量**

   在 "Environment Variables" 部分添加以下变量：

   | 变量名 | 值 | 说明 |
   |--------|-----|------|
   | `JWT_SECRET` | `your-production-secret-key-here` | JWT 密钥（务必修改为强密码）|
   | `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` | 应用 URL（部署后自动生成）|

   **重要：** `JWT_SECRET` 请使用强随机字符串，可以使用以下命令生成：
   ```bash
   # macOS/Linux
   openssl rand -base64 32

   # Node.js
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

5. **点击 "Deploy"**
   - Vercel 将自动构建和部署你的项目
   - 部署完成后会生成一个 `.vercel.app` 域名

6. **访问你的网站**
   - 部署成功后，点击生成的 URL 访问网站
   - 例如：`https://kiro-travel.vercel.app`

---

### 方法二：通过 Vercel CLI 部署

1. **安装 Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **登录 Vercel**
   ```bash
   vercel login
   ```

3. **部署项目**
   ```bash
   # 首次部署（会引导配置）
   vercel

   # 后续部署
   vercel --prod
   ```

4. **设置环境变量**
   ```bash
   vercel env add JWT_SECRET
   # 输入你的 JWT 密钥

   vercel env add NEXT_PUBLIC_APP_URL
   # 输入应用 URL
   ```

5. **重新部署**
   ```bash
   vercel --prod
   ```

---

## ⚙️ 部署后配置

### 1. 自定义域名（可选）

1. 在 Vercel 项目设置中，找到 "Domains"
2. 点击 "Add" 添加自定义域名
3. 按照指引配置 DNS 记录
4. 等待 SSL 证书自动配置��成

### 2. 更新环境变量

如果需要更新 `NEXT_PUBLIC_APP_URL`：

1. 进入项目设置
2. 找到 "Environment Variables"
3. 更新 `NEXT_PUBLIC_APP_URL` 为你的自定义域名
4. 重新部署项目

### 3. 启用 Analytics（可选）

Vercel 提供免费的分析功能：

1. 进入项目设置
2. 找到 "Analytics"
3. 点击 "Enable"

项目已集成 `@vercel/analytics`，无需额外配置。

---

## 🔄 持续部署

Vercel 支持自动部署：

### Git 集成
- ✅ **推送到 master/main 分支** → 自动部署到生产环境
- ✅ **推送到其他分支** → 自动创建预览部署
- ✅ **Pull Request** → 自动生成预览链接

### 手动触发部署
```bash
# 通过 CLI 手动部署
vercel --prod

# 或者在 Vercel Dashboard 点击 "Redeploy"
```

---

## 🐛 常见问题

### 1. SQLite 数据库问题

**问题：** 数据无法保存，或部署后数据丢失

**原因：** Vercel 无服务器环境不支持 SQLite 持久化

**解决方案：**
- 迁移到云数据库（Vercel Postgres、Supabase 等）
- 使用 Vercel KV 存储（适合简单数据）
- 使用外部 VPS 托管（Docker 部署）

### 2. 构建失败

**检查清单：**
- ✅ 确保 `package.json` 中的依赖都已安装
- ✅ 确保 TypeScript 没有类型错误（或在 `next.config.mjs` 中启用 `ignoreBuildErrors`）
- ✅ 检查构建日志中的具体错误信息
- ✅ 本地运行 `npm run build` 测试构建

### 3. 环境变量未生效

**解决方法：**
- ✅ 确保环境变量已在 Vercel 设置中配置
- ✅ 客户端变量必须以 `NEXT_PUBLIC_` 开头
- ✅ 更新环境变量后需要重新部署

### 4. API 路由 404 错误

**检查清单：**
- ✅ 确保 API 路由文件命名正确（`route.ts`）
- ✅ 确保文件位于 `app/api/` 目录下
- ✅ 检查 `vercel.json` 中的路由配置

### 5. 图片加载失败

**解决方法：**
- ✅ 在 `next.config.mjs` 中已设置 `images.unoptimized: true`
- ✅ 确保图片路径正确
- ✅ 使用外部图片服务（如 Cloudinary、imgix）

---

## 📊 性能优化

### 1. 启用边缘函数（Edge Functions）

在 API 路由中添加：
```typescript
export const runtime = 'edge'
```

### 2. 启用 ISR（增量静态再生）

在页面中添加：
```typescript
export const revalidate = 3600 // 每小时重新生成
```

### 3. 启用图片优化

如果使用外部图片服务，更新 `next.config.mjs`：
```javascript
images: {
  domains: ['your-cdn.com'],
  unoptimized: false,
}
```

---

## 🔒 安全建议

1. **JWT_SECRET**
   - ⚠️ 务必使用强随机密钥
   - ⚠️ 不要在代码中硬编码
   - ⚠️ 定期更换密钥

2. **API 路由保护**
   - ✅ 已实现 JWT 认证中间件
   - ✅ 验证用户权限
   - ✅ 限制请求频率（可选：使用 Vercel 的 Edge Config）

3. **环境变量**
   - ✅ 生产环境和开发环境使用不同的密钥
   - ✅ 不要将 `.env.local` 提交到 Git

---

## 📚 相关资源

- [Vercel 官方文档](https://vercel.com/docs)
- [Next.js 部署文档](https://nextjs.org/docs/deployment)
- [Vercel CLI 文档](https://vercel.com/docs/cli)
- [Vercel 环境变量](https://vercel.com/docs/concepts/projects/environment-variables)
- [Vercel Edge Functions](https://vercel.com/docs/concepts/functions/edge-functions)

---

## 💡 替代部署方案

如果 Vercel 不适合你的需求，可以考虑：

### 1. Docker 部署（推荐用于生产环境）
```bash
docker build -t kiro-travel .
docker run -p 3000:3000 -v ./data:/app/data kiro-travel
```

### 2. VPS 部署（如 DigitalOcean、Linode）
```bash
npm install
npm run db:init
npm run build
pm2 start npm --name "kiro-travel" -- start
```

### 3. Netlify 部署
- 类似 Vercel，但有不同的限制和功能

### 4. Railway.app 部署
- 支持 SQLite 持久化存储
- 更适合需要数据库的应用

---

## 🎉 部署成功后

1. ✅ 测试所有功能是否正常
2. ✅ 检查 API 端点是否可访问
3. ✅ ���证登录/注册功能
4. ✅ 测试数据读取功能
5. ⚠️ 注意：写入操作在 SQLite 模式下不可用

---

## 📞 获取帮助

如果遇到问题：
1. 查看 [Vercel 文档](https://vercel.com/docs)
2. 查看 [项目 Issues](https://github.com/your-username/kiro-travel/issues)
3. 加入 [Vercel Discord 社区](https://vercel.com/discord)

---

**祝你部署顺利！** 🚀
