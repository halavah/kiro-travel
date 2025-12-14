# ✅ Vercel 部署检查清单

在部署到 Vercel 之前，请确保完成以下所有步骤：

## 📋 部署前检查

### 1. 代码准备
- [ ] 所有代码已提交到 Git
- [ ] 已推送到 GitHub/GitLab/Bitbucket
- [ ] 分支名称为 `master` 或 `main`
- [ ] 没有合并冲突

### 2. 配置文件检查
- [ ] `vercel.json` 文件已创建
- [ ] `.vercelignore` 文件已创建
- [ ] `.env.example` 文件已创建
- [ ] `.gitignore` 包含敏感文件（`.env.local`, `data/*.db`）
- [ ] `package.json` 包含所有必要的依赖

### 3. 构建测试
- [ ] 本地运行 `npm install` 成功
- [ ] 本地运行 `npm run build` 成功
- [ ] 本地运行 `npm run start` 成功
- [ ] 访问 `http://localhost:3000` 正常工作
- [ ] 本地运行 `npm run lint` 无严重错误

### 4. 环境变量准备
- [ ] 已生成强随机的 `JWT_SECRET`（至少 32 字符）
- [ ] 已准备 `NEXT_PUBLIC_APP_URL`（可选）
- [ ] **重要：不要在代码中硬编码密钥**

### 5. 数据库注意事项
- [ ] 已了解 SQLite 在 Vercel 上的限制（只读）
- [ ] 如需写入功能，已准备迁移到云数据库
- [ ] 数据库文件不会被上传（已在 `.vercelignore` 中排除）

---

## 🚀 Vercel 部署步骤

### 步骤 1: 访问 Vercel
- [ ] 访问 [vercel.com](https://vercel.com)
- [ ] 使用 GitHub 账号登录
- [ ] 授权 Vercel 访问你的仓库

### 步骤 2: 导入项目
- [ ] 点击 "Add New Project"
- [ ] 选择 `kiro-travel` 仓库
- [ ] 点击 "Import"

### 步骤 3: 配置项目
- [ ] Framework Preset: `Next.js` (自动检测)
- [ ] Root Directory: `./` (默认)
- [ ] Build Command: `npm run build` (默认)
- [ ] Output Directory: `.next` (默认)
- [ ] Install Command: `npm install` (默认)

### 步骤 4: 设置环境变量
- [ ] 点击 "Environment Variables"
- [ ] 添加 `JWT_SECRET` = `your-generated-secret-key`
- [ ] 添加 `NEXT_PUBLIC_APP_URL` = `https://your-app.vercel.app` (可选)
- [ ] 确保所有变量都选择了 "Production" 环境

### 步骤 5: 部署
- [ ] 点击 "Deploy" 按钮
- [ ] 等待构建完成（通常 2-5 分钟）
- [ ] 检查部署日志，确保没有错误

---

## ✅ 部署后验证

### 1. 基本功能测试
- [ ] 访问生成的 `.vercel.app` URL
- [ ] 首页正常加载
- [ ] 导航栏显示正常
- [ ] 图片和样式加载正确

### 2. API 端点测试
- [ ] 访问 `/api/auth/login`（应返回 405 或 400，不是 404）
- [ ] 访问 `/api/spots`（应返回景点数据或空数组）
- [ ] 检查浏览器控制台，确保没有 CORS 错误

### 3. 认证功能测试
- [ ] 尝试登录（注意：SQLite 只读，可能无法登录）
- [ ] 检查 JWT token 是否正确设置
- [ ] 检查 localStorage 中的 token

### 4. 只读功能测试
以下功能应该正常工作（不需要数据库写入）：
- [ ] 浏览景点列表
- [ ] 查看景点详情
- [ ] 浏览酒店列表
- [ ] 查看活动列表
- [ ] 阅读新闻文章

### 5. 写入功能警告
以下功能在 Vercel 上**不会工作**（需要数据库写入）：
- [ ] 用户注册
- [ ] 用户登录（如果需要更新 last_login）
- [ ] 添加评论
- [ ] 收藏景点
- [ ] 购买门票
- [ ] 创建订单

---

## 🔧 部署后配置

### 1. 域名设置（可选）
- [ ] 在 Vercel 项目设置中添加自定义域名
- [ ] 配置 DNS 记录（A 或 CNAME）
- [ ] 等待 SSL 证书自动配置
- [ ] 更新 `NEXT_PUBLIC_APP_URL` 环境变量
- [ ] 重新部署项目

### 2. Analytics 启用（可选）
- [ ] 进入项目设置
- [ ] 找到 "Analytics" 选项
- [ ] 点击 "Enable Web Analytics"
- [ ] 重新部署项目（如果需要）

### 3. 性能优化（可选）
- [ ] 查看 Vercel Speed Insights
- [ ] 检查 Lighthouse 分数
- [ ] 优化图片加载
- [ ] 启用 Edge Functions（如果需要）

---

## 🐛 常见问题排查

### 如果构建失败
- [ ] 检查构建日志中的错误信息
- [ ] 确保本地 `npm run build` 能成功
- [ ] 检查 TypeScript 类型错误
- [ ] 确认所有依赖都在 `package.json` 中
- [ ] 检查 Node.js 版本兼容性

### 如果部署成功但无法访问
- [ ] 检查部署状态（是否是 "Ready"）
- [ ] 清除浏览器缓存
- [ ] 检查 Vercel 状态页面（status.vercel.com）
- [ ] 查看部署详情中的预览 URL

### 如果 API 返回错误
- [ ] 检查环境变量是否正确设置
- [ ] 查看 Vercel Functions 日志
- [ ] 确认 API 路由文件命名正确
- [ ] 检查 `vercel.json` 中的路由配置

### 如果出现数据库错误
- [ ] 确认是否尝试执行写入操作
- [ ] 考虑迁移到云数据库
- [ ] 检查 API 路由中的数据库调用

---

## 📊 性能监控

### 部署后监控清单
- [ ] 设置 Vercel Analytics（免费）
- [ ] 监控函数执行时间
- [ ] 检查冷启动时间
- [ ] 监控错误率
- [ ] 查看地理分布数据

### 建议的监控工具
- [ ] Vercel Analytics（已集成）
- [ ] Google Analytics（可选）
- [ ] Sentry（错误追踪，可选）
- [ ] LogRocket（用户会话回放，可选）

---

## 🔒 安全检查

### 部署后安全清单
- [ ] `JWT_SECRET` 使用强随机密钥
- [ ] 环境变量未在代码中硬编码
- [ ] `.env.local` 未提交到 Git
- [ ] API 路由有适当的身份验证
- [ ] 生产环境禁用调试模式
- [ ] CORS 设置正确（不要用 `*` 在生产环境）

---

## 📝 部署记录

### 记录以下信息以便后续维护

**部署日期：** ____________________

**Vercel 项目名称：** ____________________

**生产 URL：** ____________________

**自定义域名（如有）：** ____________________

**部署分支：** ____________________

**Node.js 版本：** ____________________

**部署人员：** ____________________

**备注：**
_______________________________________________
_______________________________________________
_______________________________________________

---

## 🎉 完成部署！

如果以上所有步骤都已完成，恭喜你成功部署到 Vercel！

### 下一步
1. 分享你的应用 URL
2. 监控应用性能和错误
3. 根据需要迭代和优化
4. 考虑迁移到云数据库以支持完整功能

### 需要帮助？
- 查看 [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) 完整指南
- 查看 [VERCEL_QUICKSTART.md](VERCEL_QUICKSTART.md) 快速参考
- 访问 [Vercel 文档](https://vercel.com/docs)
- 加入 [Vercel Discord](https://vercel.com/discord)

---

**祝你部署顺利！** 🚀
