# Docker 部署指南

> **适用项目**：kiro-travel Next.js 16 + SQLite
>
> **部署方式**：Docker 容器化部署
>
> **适用场景**：自有服务器、VPS、云服务器

---

## 📋 目录

- [为什么使用 Docker](#为什么使用-docker)
- [Docker 部署优势](#docker-部署优势)
- [前置要求](#前置要求)
- [Docker 配置](#docker-配置)
- [本地 Docker 部署](#本地-docker-部署)
- [生产环境部署](#生产环境部署)
- [数据持久化](#数据持久化)
- [Docker Compose 部署](#docker-compose-部署)
- [常见问题](#常见问题)

---

## 为什么使用 Docker？

### Docker vs 其他部署方式

| 部署方式 | 优点 | 缺点 | 适用场景 |
|---------|------|------|---------|
| **Render.com** | 完全免费、零配置 | 自动休眠、资源限制 | 演示项目、原型 |
| **Docker** | 完全控制、高性能、稳定 | 需要服务器、需要配置 | 生产环境、自有服务器 |
| **Vercel** | 零配置、全球 CDN | 不支持 SQLite | 需要外部数据库的项目 |

### Docker 适合你的场景

✅ 适合使用 Docker：
- 有自己的 VPS 或云服务器（阿里云、腾讯云、AWS 等）
- 需要完全控制部署环境
- 不想受免费平台限制（无休眠、无流量限制）
- 需要高性能和稳定性
- 想学习 Docker 容器化技术

❌ 不适合使用 Docker：
- 没有服务器，只想免费白嫖 → 使用 [Render.com](./Render部署快速指南.md)
- 不想学习 Docker → 使用 Render.com 或 Vercel
- 只是演示项目 → Render.com 更简单

---

## Docker 部署优势

### 1. 环境一致性
```
开发环境 = 测试环境 = 生产环境
```
- 告别 "在我机器上能跑" 的问题
- 所有依赖打包在镜像中
- 跨平台部署（Linux、macOS、Windows）

### 2. 快速部署
```bash
# 一行命令启动
docker run -p 3000:3000 kiro-travel
```

### 3. 资源隔离
- 每个容器独立运行
- 不影响宿主机环境
- 易于扩展和升级

### 4. 完全控制
- 无需依赖第三方平台
- 无休眠、无限制
- 自定义配置

---

## 前置要求

### 1. 安装 Docker

#### macOS
```bash
# 使用 Homebrew 安装
brew install --cask docker

# 或下载 Docker Desktop
# https://www.docker.com/products/docker-desktop
```

#### Windows
1. 下载 Docker Desktop：https://www.docker.com/products/docker-desktop
2. 运行安装程序
3. 重启电脑

#### Linux (Ubuntu/Debian)
```bash
# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 启动 Docker
sudo systemctl start docker
sudo systemctl enable docker

# 添加当前用户到 docker 组（避免每次 sudo）
sudo usermod -aG docker $USER
```

### 2. 验证安装

```bash
# 检查 Docker 版本
docker --version
# Docker version 24.0.0, build xxx

# 测试 Docker 运行
docker run hello-world
```

---

## Docker 配置

### 第一步：创建 Dockerfile

在项目根目录创建 `Dockerfile`：

```dockerfile
# 使用 Node.js 18 官方镜像
FROM node:18-alpine AS base

# 安装依赖阶段
FROM base AS deps
# 安装 better-sqlite3 需要的构建工具
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

# 复制 package.json 和 lock 文件
COPY package.json package-lock.json* ./
RUN npm ci

# 构建阶段
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 设置环境变量
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# 构建 Next.js 应用
RUN npm run build

# 生产阶段
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制构建产物
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# 创建数据目录
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data

# 切换到非 root 用户
USER nextjs

# 暴露端口
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 启动应用
CMD ["node", "server.js"]
```

### 第二步：更新 next.config.mjs

添加 `output: 'standalone'` 配置：

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // 启用 standalone 模式
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
}

export default nextConfig
```

### 第三步：创建 .dockerignore

在项目根目录创建 `.dockerignore`：

```
# 依赖
node_modules
.pnp
.pnp.js

# 测试
coverage

# Next.js
.next
out

# 生产
build

# 环境变量
.env*.local
.env

# 调试日志
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# 操作系统
.DS_Store
*.pem

# IDE
.vscode
.idea
*.swp
*.swo

# Git
.git
.gitignore

# 数据库（开发环境）
data/*.db
data/*.sqlite
*.sqlite
*.sqlite3

# 文档
docs
README.md

# 其他
.vercel
```

---

## 本地 Docker 部署

### 1. 构建 Docker 镜像

```bash
cd /Volumes/Samsung/software_yare/kiro-travel

# 构建镜像（需要 5-10 分钟）
docker build -t kiro-travel .

# 查看构建的镜像
docker images
```

**预期输出**：
```
REPOSITORY      TAG       IMAGE ID       CREATED         SIZE
kiro-travel     latest    abc123def456   2 minutes ago   450MB
```

### 2. 运行容器

```bash
# 基本运行
docker run -p 3000:3000 kiro-travel

# 后台运行
docker run -d -p 3000:3000 --name kiro-travel kiro-travel

# 带环境变量运行
docker run -d \
  -p 3000:3000 \
  -e JWT_SECRET=your-secret-key \
  -e NEXT_PUBLIC_APP_URL=http://localhost:3000 \
  --name kiro-travel \
  kiro-travel
```

### 3. 访问应用

打开浏览器访问：http://localhost:3000

### 4. 查看容器状态

```bash
# 查看运行中的容器
docker ps

# 查看容器日志
docker logs kiro-travel

# 实时查看日志
docker logs -f kiro-travel

# 进入容器 Shell
docker exec -it kiro-travel sh
```

### 5. 停止和删除容器

```bash
# 停止容器
docker stop kiro-travel

# 启动容器
docker start kiro-travel

# 删除容器
docker rm kiro-travel

# 删除镜像
docker rmi kiro-travel
```

---

## 数据持久化

### 问题：容器删除后数据丢失

Docker 容器是临时的，删除容器后数据会丢失。需要使用 **Docker Volumes** 持久化数据。

### 解决方案：使用 Docker Volume

#### 方法一：命名卷（推荐）

```bash
# 创建命名卷
docker volume create kiro-travel-data

# 运行容器并挂载卷
docker run -d \
  -p 3000:3000 \
  -v kiro-travel-data:/app/data \
  -e JWT_SECRET=your-secret-key \
  --name kiro-travel \
  kiro-travel

# 查���卷
docker volume ls

# 查看卷详情
docker volume inspect kiro-travel-data
```

#### 方法二：绑定挂载（开发环境）

```bash
# 挂载本地目录到容器
docker run -d \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -e JWT_SECRET=your-secret-key \
  --name kiro-travel \
  kiro-travel
```

### 初始化数据库

```bash
# 进入容器
docker exec -it kiro-travel sh

# 初始化数据库
npm run db:init

# 退出
exit
```

### 备份和恢复数据

#### 备份数据库

```bash
# 复制数据库文件到本地
docker cp kiro-travel:/app/data/database.sqlite ./backup-$(date +%Y%m%d).sqlite

# 或者使用卷备份
docker run --rm \
  -v kiro-travel-data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/backup-$(date +%Y%m%d).tar.gz /data
```

#### 恢复数据库

```bash
# 从本地复制到容器
docker cp ./backup-20251215.sqlite kiro-travel:/app/data/database.sqlite

# 重启容器
docker restart kiro-travel
```

---

## Docker Compose 部署

使用 Docker Compose 简化多容器管理。

### 第一步：创建 docker-compose.yml

在项目根目录创建 `docker-compose.yml`：

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: kiro-travel
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - JWT_SECRET=${JWT_SECRET:-change-this-secret-key}
      - NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL:-http://localhost:3000}
      - DATABASE_PATH=/app/data/database.sqlite
    volumes:
      - kiro-travel-data:/app/data
    networks:
      - kiro-network
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

volumes:
  kiro-travel-data:
    driver: local

networks:
  kiro-network:
    driver: bridge
```

### 第二步：创建 .env 文件

```bash
# 复制示例文件
cp .env.example .env

# 编辑 .env
nano .env
```

```.env
JWT_SECRET=your-super-secret-jwt-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_PATH=/app/data/database.sqlite
```

### 第三步：使用 Docker Compose

```bash
# 构建并启动
docker-compose up -d

# 查看日志
docker-compose logs -f

# 初始化数据库
docker-compose exec app npm run db:init

# 停止
docker-compose down

# 停止并删除卷（危险！会删除数据）
docker-compose down -v

# 重新构建
docker-compose up -d --build
```

---

## 生产环境部署

### 场景一：部署到阿里云 ECS

#### 1. 准备服务器

```bash
# SSH 连接服务器
ssh root@your-server-ip

# 安装 Docker
curl -fsSL https://get.docker.com | bash -s docker --mirror Aliyun

# 启动 Docker
systemctl start docker
systemctl enable docker
```

#### 2. 上传项目

```bash
# 方法一：使用 Git
git clone https://github.com/your-username/kiro-travel.git
cd kiro-travel

# 方法二：使用 SCP
scp -r /Volumes/Samsung/software_yare/kiro-travel root@your-server-ip:/opt/
```

#### 3. 构建和运行

```bash
# 构建镜像
docker build -t kiro-travel .

# 运行容器
docker run -d \
  -p 80:3000 \
  -v kiro-travel-data:/app/data \
  -e JWT_SECRET=$(openssl rand -hex 32) \
  -e NEXT_PUBLIC_APP_URL=http://your-domain.com \
  --restart unless-stopped \
  --name kiro-travel \
  kiro-travel

# 初始化数据库
docker exec kiro-travel npm run db:init
```

#### 4. 配置 Nginx 反向代理（可选）

```nginx
# /etc/nginx/sites-available/kiro-travel
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# 启用站点
ln -s /etc/nginx/sites-available/kiro-travel /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### 场景二：部署到 Google Cloud Run

#### 1. 安装 Google Cloud SDK

```bash
# macOS
brew install google-cloud-sdk

# 登录
gcloud auth login
```

#### 2. 构建并推送镜像

```bash
# 创建项目
gcloud projects create kiro-travel-prod
gcloud config set project kiro-travel-prod

# 启用 Cloud Build
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com

# 构建镜像
gcloud builds submit --tag gcr.io/kiro-travel-prod/kiro-travel

# 部署到 Cloud Run
gcloud run deploy kiro-travel \
  --image gcr.io/kiro-travel-prod/kiro-travel \
  --platform managed \
  --region asia-east1 \
  --allow-unauthenticated \
  --set-env-vars JWT_SECRET=your-secret,NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 场景三：使用 Docker Hub 分发镜像

#### 1. 注册 Docker Hub

访问 https://hub.docker.com/ 注册账号

#### 2. 推送镜像

```bash
# 登录
docker login

# 打标签
docker tag kiro-travel your-username/kiro-travel:latest

# 推送
docker push your-username/kiro-travel:latest
```

#### 3. 在其他服务器拉取

```bash
# 拉取镜像
docker pull your-username/kiro-travel:latest

# 运行
docker run -d -p 3000:3000 your-username/kiro-travel:latest
```

---

## 常见问题

### Q1: 构建失败 - better-sqlite3 编译错误

**错误信息**：
```
Error: Cannot find module 'better-sqlite3'
```

**解决方案**：
确保 Dockerfile 中安装了构建工具：
```dockerfile
RUN apk add --no-cache libc6-compat python3 make g++
```

### Q2: 数据库文件权限错误

**错误信息**：
```
EACCES: permission denied, open '/app/data/database.sqlite'
```

**解决方案**：
```bash
# 检查容器内权限
docker exec kiro-travel ls -la /app/data

# 修复权限
docker exec kiro-travel chown -R nextjs:nodejs /app/data
```

### Q3: 容器内无法访问外部网络

**解决方案**：
```bash
# 检查 Docker 网络
docker network ls

# 重建默认网络
docker network create bridge
```

### Q4: 镜像体积太大（> 1GB）

**优化方案**：

1. 使用 Alpine 基础镜像（已在示例中使用）
2. 多阶段构建（已在示例中使用）
3. 清理缓存：

```dockerfile
# 在 RUN 命令中清理缓存
RUN npm ci && npm cache clean --force
```

### Q5: 如何查看容器内的文件？

```bash
# 方法一：进入容器
docker exec -it kiro-travel sh
ls -la /app

# 方法二：复制文件到本地
docker cp kiro-travel:/app/data ./inspect
```

---

## 性能优化

### 1. 启用 BuildKit

```bash
# 启用 Docker BuildKit（更快的构建）
export DOCKER_BUILDKIT=1

# 构建
docker build -t kiro-travel .
```

### 2. 使用构建缓存

```bash
# 使用缓存构建
docker build --cache-from kiro-travel:latest -t kiro-travel .
```

### 3. 限制容器资源

```bash
# 限制 CPU 和内存
docker run -d \
  -p 3000:3000 \
  --cpus="1.0" \
  --memory="512m" \
  --name kiro-travel \
  kiro-travel
```

### 4. 健康检查

在 Dockerfile 中添加：

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1
```

---

## 监控和日志

### 查看容器资源使用

```bash
# 实时查看
docker stats kiro-travel

# 查看所有容器
docker stats
```

### 日志管理

```bash
# 查看最近 100 行日志
docker logs --tail 100 kiro-travel

# 实时查看日志
docker logs -f kiro-travel

# 查看带时间戳的日志
docker logs -t kiro-travel

# 导出日志到文件
docker logs kiro-travel > kiro-travel.log
```

---

## 对比：Docker vs Render.com

| 特性 | Docker 部署 | Render.com |
|------|-----------|------------|
| **成本** | 服务器费用（$5-50/月） | 免费 |
| **配置复杂度** | 中等（需要学习 Docker） | 极���（零配置） |
| **性能** | 优秀（完全控制） | 良好（共享资源） |
| **自动休眠** | 无 | 15 分钟无访问休眠 |
| **资源限制** | 根据服务器配置 | 750 小时/月 |
| **数据持久化** | 完全控制 | 需配置持久化磁盘 |
| **扩展性** | 高（容易扩展） | 有限 |
| **学习曲线** | 陡峭 | 平缓 |
| **适用场景** | 生产环境、自有服务器 | 演示项目、原型 |

### 推荐选择

- **演示项目、学习用途** → [Render.com](./Render部署快速指南.md)
- **生产环境、有服务器** → Docker 部署
- **需要全球 CDN、高并发** → Vercel + Turso

---

## 下一步

### 1. 本地测试

```bash
# 构建镜像
docker build -t kiro-travel .

# 运行容器
docker run -d -p 3000:3000 \
  -v kiro-travel-data:/app/data \
  --name kiro-travel \
  kiro-travel

# 初始化数据库
docker exec kiro-travel npm run db:init

# 访问 http://localhost:3000
```

### 2. 生产部署

选择部署方案：
- 阿里云 ECS / 腾讯云 CVM
- AWS EC2
- Google Cloud Run
- DigitalOcean Droplet

### 3. 持续学习

- Docker 官方文档：https://docs.docker.com/
- Next.js Docker 部署：https://nextjs.org/docs/deployment#docker-image
- Docker Compose：https://docs.docker.com/compose/

---

## 相关文档

- [Render 部署快速指南](./Render部署快速指南.md) - 免费零配置部署
- [部署平台对比分析](./部署平台对比分析.md) - 选择合适的部署方案
- [部署检查清单](./部署检查清单.md) - Render 部署验证

---

**最后更新**：2025-12-15
