# 使用 Node.js 20 Debian Slim 镜像（better-sqlite3 和 lightningcss 需要更好的原生模块支持）
# 注意：使用 linux/amd64 平台以确保 lightningcss 原生模块正确安装
# 参考：https://github.com/tailwindlabs/tailwindcss/issues/17728
FROM node:20-slim AS base

# 构建阶段（合并依赖安装和构建，确保原生模块在正确环境中编译）
FROM base AS builder
WORKDIR /app

# 安装编译工具（better-sqlite3 和 lightningcss 需要）
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# 复制 package.json 并在有编译工具的环境中安装依赖
# 这确保 lightningcss 安装 linux-x64-gnu 版本而不是 darwin-arm64
COPY package.json package-lock.json* ./
RUN npm ci

# 显式安装 Tailwind CSS v4 所需的原生模块（修复 optional dependency 被跳过的问题）
# 参考：https://github.com/tailwindlabs/tailwindcss/issues/17728
# 参考：https://github.com/npm/cli/issues/4828
RUN npm install --no-save \
    lightningcss-linux-x64-gnu \
    @tailwindcss/oxide-linux-x64-gnu \
    || true

# 复制源代码
COPY . .

# 设置环境变量
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# 构建 Next.js 应用
RUN npm run build

# 生产阶段
FROM base AS runner
WORKDIR /app

# 安装运行时需要的工具（wget 用于健康检查）
RUN apt-get update && apt-get install -y --no-install-recommends \
    wget \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 创建非 root 用户（Debian 语法）
RUN groupadd -r -g 1001 nodejs && \
    useradd -r -u 1001 -g nodejs nextjs

# 复制构建产物
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# 创建数据目录
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data

# 切换到非 root 用户
USER nextjs

# 暴露端口
EXPOSE 22310

ENV PORT=22310
ENV HOSTNAME="0.0.0.0"

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:22310/api/health || exit 1

# 启动应用
CMD ["node", "server.js"]
