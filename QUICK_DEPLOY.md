# 🚀 Vercel 一页纸快速部署指南

## 1️⃣ 准备工作（2 分钟）

```bash
# 1. 运行部署检查
./check-deployment.sh         # macOS/Linux
check-deployment.bat          # Windows

# 2. 生成 JWT 密钥
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# 3. 提交代码
git add .
git commit -m "feat: 准备 Vercel 部署"
git push origin master
```

## 2️⃣ Vercel 配置（3 分钟）

1. 访问 [vercel.com](https://vercel.com)，用 GitHub 登录
2. 点击 **"Add New Project"**
3. 选择你�� `kiro-travel` 仓库
4. 点击 **"Import"**

## 3️⃣ 环境变量（1 分钟）

在 "Environment Variables" 部分添加：

| 变量名 | 值 |
|--------|-----|
| `JWT_SECRET` | `你刚才生成的密钥` |

## 4️⃣ 部署（2 分钟）

点击 **"Deploy"** 按钮，等待构建完成。

## 5️⃣ 完成 ✅

访问生成的 `.vercel.app` URL，开始使用！

---

## ⚠️ 重要提醒

- SQLite 在 Vercel 上**只读**，写入功能不可用
- 需要完整功能？迁移到 [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)

---

## 📚 需要更多帮助？

- [完整指南](VERCEL_DEPLOYMENT.md)
- [检查清单](DEPLOYMENT_CHECKLIST.md)
- [快速参考](VERCEL_QUICKSTART.md)

---

**总用时：约 10 分钟** ⏱️
