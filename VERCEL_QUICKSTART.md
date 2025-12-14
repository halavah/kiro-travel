# ⚡ Vercel 快速设置指南

## 🔑 环境变量配置

在 Vercel 项目设置中配置以下环境变量：

### 必需变量

| 变量名 | 示例值 | 说明 |
|--------|--------|------|
| `JWT_SECRET` | `your-secret-key-here` | JWT 认证密钥（必须是强随机字符串）|

### 可选变量

| 变量名 | 示例值 | 说明 |
|--------|--------|------|
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` | 应用的完整 URL |

### 生成强密钥

```bash
# 方法 1: 使用 OpenSSL
openssl rand -base64 32

# 方法 2: 使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# 方法 3: 使用 Python
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

---

## 📦 Vercel 项目设置

### Framework Preset
```
Next.js
```

### Root Directory
```
./
```

### Build Command
```bash
npm run build
```

### Output Directory
```
.next
```

### Install Command
```bash
npm install
```

### Node.js Version
```
20.x
```

---

## 🌍 推荐 Region 设置

为了获得最佳性能，推荐选择离用户最���的区域：

- **中国用户**: Hong Kong (hkg1)
- **亚太地区**: Singapore (sin1)
- **北美地区**: Washington, D.C. (iad1)
- **欧洲地区**: Frankfurt (fra1)

在 `vercel.json` 中已配置为 Hong Kong：
```json
{
  "regions": ["hkg1"]
}
```

---

## 🔄 自动部署配置

### Git 集成

Vercel 会自动监听以下分支的推送：
- `master` 或 `main` → 生产环境部署
- 其他分支 → 预览环境部署
- Pull Request → 自动生成预览链接

### GitHub Actions

如果使用 GitHub Actions 自动部署，需要配置以下 Secrets：

| Secret 名称 | 获取方式 | 说明 |
|-------------|----------|------|
| `VERCEL_TOKEN` | Vercel Settings → Tokens | Vercel API Token |
| `VERCEL_ORG_ID` | 项目设置 → General | 组织 ID |
| `VERCEL_PROJECT_ID` | 项目设置 → General | 项目 ID |
| `JWT_SECRET` | 自己生成 | JWT 认证密钥 |
| `NEXT_PUBLIC_APP_URL` | 部署后的 URL | 应用 URL（可选）|

获取 Vercel Token：
1. 访问 [Vercel Account Settings](https://vercel.com/account/tokens)
2. 点击 "Create Token"
3. 命名为 "GitHub Actions"
4. 复制 Token

获取 Project ID 和 Org ID：
```bash
# 方法 1: 通过 Vercel CLI
vercel link

# 方法 2: 在 Vercel Dashboard
# 项目设置 → General → Project ID 和 Team ID
```

---

## 🚨 常见问题快速修复

### 1. 构建失败：找不到模块

**解决方案：**
```bash
# 确保所有依赖都在 package.json 中
npm install --save-dev @types/node @types/react @types/react-dom

# 重新部署
```

### 2. API 路由 500 错误

**原因：** SQLite 不支持 Vercel 无服务器环境

**解决方案：**
- 迁移到 Vercel Postgres
- 使用外部云数据库（Supabase、PlanetScale）

### 3. 环境变量不生效

**检查清单：**
- ✅ 确认变量已在 Vercel 设置中添加
- ✅ 客户端变量必须以 `NEXT_PUBLIC_` 开头
- ✅ 添加/修改变量后需要重新部署

### 4. 图片无法加载

**解决方案：**
```javascript
// next.config.mjs
export default {
  images: {
    unoptimized: true, // 已配置
  },
}
```

### 5. CORS 错误

**解决方案：**
已在 `vercel.json` 中配置 CORS headers，如果仍有问题：
```json
{
  "headers": [
    {
      "source": "/api/:path*",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" }
      ]
    }
  ]
}
```

---

## 📊 性能优化建议

### 1. 启用 Edge Runtime

在 API 路由中添加：
```typescript
export const runtime = 'edge'
```

### 2. 启用增量静态再生 (ISR)

在页面中添加：
```typescript
export const revalidate = 3600 // 每小时更新
```

### 3. 启用 Vercel Analytics

已集成 `@vercel/analytics`，在 Vercel 项目设置中启用：
```
Settings → Analytics → Enable
```

---

## 🔗 有用的链接

- [Vercel Dashboard](https://vercel.com/dashboard)
- [Vercel 文档](https://vercel.com/docs)
- [环境变量设置](https://vercel.com/docs/concepts/projects/environment-variables)
- [部署日志](https://vercel.com/docs/concepts/deployments/logs)
- [域名配置](https://vercel.com/docs/concepts/projects/domains)

---

## 📞 需要帮助？

- 查看 [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) 完整指南
- 访问 [Vercel Discord](https://vercel.com/discord)
- 查看 [项目 Issues](https://github.com/your-username/kiro-travel/issues)

---

**提示：** 记得在 GitHub 上将 `your-username` 替换为你的实际用户名！
