# 🌍 Kiro Travel - 旅游服务系统

基于 Next.js 16 + SQLite 的现代化旅游服务平台，提供景点浏览、门票预订、酒店预订、旅游活动等全方位旅游服务。

![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19.2-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![SQLite](https://img.shields.io/badge/SQLite-better--sqlite3-003b57?style=flat-square&logo=sqlite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8?style=flat-square&logo=tailwind-css)

> ⚡ 已完成从 Supabase 到 SQLite 的完整迁移，使用 JWT 认证和本地数据库

## ✨ 功能特性

### 🏞️ 景点系统
- 景点浏览和搜索
- 景点详情、评论、评分
- 收藏和点赞功能
- 景点推荐算法
- 分类统计图表
- Excel 数据导出

### 🎫 门票系统
- 门票购买和管理
- 购物车功能
- 订单管理
- 多种门票类型
- 库存管理

### 🏨 酒店系统
- 酒店和房间浏览
- 在线预订
- 入住日期选择
- 预订状态追踪

### 🎭 旅游活动
- 活动浏览和详情
- 活动类型分类
- 参与人数管理

### 📰 新闻中心
- 新闻列表和详情
- 浏览量统计
- 管理员发布

### 👥 用户系统
- 三种角色（普通用户、导游、管理员）
- 个人中心
- 订单和收藏管理

## 🚀 快速启动

### 🎯 一键启动（推荐）

#### macOS / Linux
```bash
# 克隆项目
git clone <your-repo-url>
cd kiro-travel

# 使用启动脚本（自动处理端口冲突、清理缓存、初始化数据库）
./start.sh

# 或者手动运行完整重启
npm install
npm run db:init
npm run dev
```

#### Windows
```batch
# 克隆项目
git clone <your-repo-url>
cd kiro-travel

# 使用启动脚本（自动处理端口冲突、清理缓存、初始化数据库）
start.bat

# 或者手动运行完整重启
npm install
npm run db:init
npm run dev
```

### 📋 启动脚本功能

`start.sh` (macOS/Linux) 和 `start.bat` (Windows) 提供以下功能：

**开发模式:**
1. **开发服务器** - 启动开发服务器
2. **完整重启** ⭐ (默认) - 清理端口、进程、缓存后重启

**生产模式:**
3. **构建项目** - 构建生产版本
4. **启动生产服务器** - 启动生产服务器
5. **构建并启动** - 构建并启动生产服务器

**清理操作:**
6. **清理 .next 目录** - 删除构建缓存
7. **清理 node_modules** - 删除并重装依赖
8. **清理端口 3000** - 终止占用 3000 端口的进程
9. **清理所有进程** - 终止所有 Next.js 进程

**数据库操作:**
10. **初始化数据库** - 创建表 + 测试数据 + FTS 索引
11. **重置数据库** - 删除并重新创建数据库
12. **查看数据统计** - 显示数据库中的数据统计
13. **设置 FTS 索引** - 单独设置全文搜索索引

**其他:**
14. **代码检查** - 运行 ESLint
15. **类型检查** - 运行 TypeScript 类型检查
0. **退出**

访问 [http://localhost:3000](http://localhost:3000)

### 手动启动

如果需要手动执行步骤：

1. **安装依赖**
   ```bash
   npm install
   ```

2. **初始化数据库**
   ```bash
   npm run db:init
   ```
   这会自动：
   - 创建 `data/travel.db` SQLite 数据库文件
   - 创建所有数据表
   - 插入示例数据

3. **启动开发服务器**
   ```bash
   npm run dev
   ```

### 默认测试账户

系统初始化后会创建以下测试账户（所有账号密码均为：`password123`）：

#### 👑 管理员账号 (Admin)
| 角色 | 邮箱 | 姓名 | 权限说明 |
|------|------|------|----------|
| 系统管理员 | admin@kiro.com | 系统管理员 | 最高管理权限，可管理所有数据 |
| 运营经理 | manager@kiro.com | 运营经理 | 运营管理权限，可管理业务数据 |

#### 🧭 导游账号 (Guide)
| 角色 | 邮箱 | 姓名 | 权限说明 |
|------|------|------|----------|
| 导游 | guide1@test.com | 王五 | 导游专属功能，可创建活动和景点介绍 |
| 导游 | guide2@test.com | 赵六 | 导游专属功能，可创建活动和景点介绍 |
| 导游 | guide3@test.com | 孙七 | 导游专属功能，可创建活动和景点介绍 |

#### 👤 普通用户账号 (User)
| 邮箱 | 姓名 | 用途说明 |
|------|------|----------|
| zhang@test.com | 张三 | 测试预订、评论、收藏等功能 |
| li@test.com | 李四 | 测试购物车、订单等功能 |
| user1@test.com | 测试用户1 | 通用测试账号 |
| user2@test.com | 测试用户2 | 通用测试账号 |
| user3@test.com | 测试用户3 | 通用测试账号 |
| demo@test.com | 演示账号 | 用于演示展示 |
| test@test.com | 测试账号 | 用于自动化测试 |

> 💡 **安全提示**
> - 生产环境请务必修改所有默认密码
> - 建议首次登录后立即修改密码
> - 请勿在生产环境使用这些测试账号

## 📚 文档

完整的项目文档请查看 [docs](docs/) 目录：

- **[📖 文档中心](docs/README.md)** - 文档总览
- **[📊 数据库结构](docs/DATABASE_SCHEMA.md)** - ER 图和表关系说明
- **[🔌 API 文档](docs/API_DOCUMENTATION.md)** - 完整的 API 端点文档

## 🏗️ 项目结构

```
kiro-travel/
├── app/                      # Next.js 16 App Router
│   ├── api/                 # API Routes (RESTful)
│   │   ├── auth/           # 认证 API (login, register, me)
│   │   ├─��� spots/          # 景点 API
│   │   ├── tickets/        # 门票 API
│   │   ├── cart/           # 购物车 API
│   │   ├── orders/         # 订单 API
│   │   ├── hotels/         # 酒店 API
│   │   ├── activities/     # 活动 API
│   │   ├── news/           # 新闻 API
│   │   └── favorites/      # 收藏 API
│   ├── (auth)/             # 认证页面组 (login, register)
│   └── (main)/             # 主要功能页面
│       ├── spots/          # 景点页面
│       ├── hotels/         # 酒店页面
│       ├── activities/     # 活动页面
│       ├── news/           # 新闻页面
│       ├── cart/           # 购物车页面
│       ├── orders/         # 订单页面
│       ├── favorites/      # 收藏页面
│       └── profile/        # 个人中心
├── components/              # React 组件
│   ├── ui/                 # UI 基础组件 (Radix UI + shadcn/ui)
│   ├── layout/             # 布局组件 (header, footer)
│   ├── spots/              # 景点相关组件
│   ├── hotels/             # 酒店相关组件
│   ├── cart/               # 购物车组件
│   └── ...                 # 其他业务组件
├── lib/                     # 核心工具库
│   ├── db.ts               # SQLite 数据库配置 (better-sqlite3)
│   ├── db-utils.ts         # 数据库工具函数 (dbGet, dbAll, dbRun)
│   ├── auth.ts             # JWT 认证工具
│   └── utils.ts            # 通用工具函数
├── data/                    # 数据目录
│   └── travel.db           # SQLite 数据库文件
├── scripts/                 # 数据库脚本
│   ├── init-db.mjs         # 数据库初始化脚本 (Node.js)
│   ├── 001_create_tables_sqlite.sql  # 创建表结构 (SQLite)
│   └── 002_insert_test_data.sql      # 插入测试数据
├── start.sh                 # macOS/Linux 启动脚本
├── start.bat                # Windows 启动脚本
└── types/                   # TypeScript 类型定义
```

## 🛠️ 技术栈

### 前端框架
- **Next.js 16** - React 框架（Turbopack + App Router）
- **React 19.2** - UI 库
- **TypeScript 5.0** - 类型安全
- **Tailwind CSS 4** - 原子化 CSS 框架
- **Radix UI** - 无障碍 UI 组件库
- **shadcn/ui** - 高质量组件集合

### 数据与状态
- **better-sqlite3** - 高性能同步 SQLite 库
- **React Hooks** - 状态管理
- **localStorage** - 客户端持久化存储

### 表单与验证
- **React Hook Form** - 表单管理
- **Zod** - 运行时类型验证

### 数据可视化
- **Recharts** - 图表库

### 后端与认证
- **Next.js API Routes** - RESTful API
- **JWT (jsonwebtoken)** - 无状态身份认证
- **bcryptjs** - 密码哈希加密
- **SQLite** - 嵌入式数据库
  - 零配置启动
  - 支持事务和并发
  - 文件级别备份

### 开发工具
- **ESLint** - 代码检查
- **Prettier** - 代码格式化
- **TypeScript** - 静态类型检查

## 📊 数据库架构

系统使用 **SQLite** 数据库，包含 **12 张核心数据表**：

### 核心表结构
- 👥 **用户系统**: `users` (用户表，包含认证信息)
- 🏞️ **景点系统**: `spot_categories`, `spots`, `spot_comments`, `spot_favorites`, `spot_likes`
- 🎫 **门票系统**: `tickets`, `cart_items`, `orders`, `order_items`
- 🏨 **酒店系统**: `hotels`, `hotel_rooms`, `hotel_bookings`
- 🎭 **活动系统**: `activities`
- 📰 **新闻系统**: `news`

### 数据库特点
- ✅ 外键约束确保数据完整性
- ✅ 自动时间戳 (created_at, updated_at)
- ✅ 索引优化查询性能
- ✅ 事务支持保证原子性
- ✅ 测试数据自动初始化
- ✅ **FTS5 全文搜索索引** - 支持快速中文搜索
- ✅ **自动触发器同步** - FTS 索引自动更新

详细的 ER 图和表关系说明请查看 [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md)

## 🚀 高级特性

### 📊 Excel 数据导出
统计页面支持一键导出数据为 Excel 文件：
- 景点分类统计数据
- 浏览量和评分分析
- 自动生成带日期的文件名
- 格式化的表格样式

### 🔍 全文搜索 (FTS5)
使用 SQLite FTS5 实现高性能全文搜索：
- **中文分词支持** - 自动识别中文词汇
- **多关键词搜索** - 支持空格分隔多个搜索词
- **自动排名** - 搜索结果按相关度排序
- **实时同步** - 数据变更自动更新索引
- **性能提升** - 比传统 LIKE 查询快 10-100 倍

```bash
# 运行全文搜索设置（首次使用或重置数据库后）
npm run db:fts
```

## 🔐 安全特性

- ✅ **JWT 令牌认证** - 无状态身份验证
- ✅ **bcryptjs 密码加密** - 安全的密码哈希
- ✅ **基于角色的访问控制 (RBAC)** - 三种用户角色权限管理
- ✅ **SQL 注入防护** - 使用参数化查询
- ✅ **Authorization Header** - Bearer Token 认证模式
- ✅ **Token 过期管理** - 7 天自动过期
- ✅ **跨标签页同步** - Storage Event 监听登录状态

## 📝 可用命令

```bash
# 🚀 启动脚本（推荐）
./start.sh          # macOS/Linux 交互式启动菜单
start.bat           # Windows 交互式启动菜单

# 📦 开发
npm install         # 安装依赖
npm run dev         # 启动开发服务器 (http://localhost:3000)
npm run build       # 构建生产版本
npm run start       # 启动生产服务器
npm run lint        # ESLint 代码检查

# 🗄️ 数据库
npm run db:init     # 初始化数据库（创建表 + 插入测试数据 + FTS索引）
npm run db:reset    # 重置数据库（删除并重新创建）
npm run db:fts      # 单独设置全文搜索索引

# 🧹 清理
rm -rf .next        # 删除 Next.js 构建缓存
rm data/travel.db   # 删除数据库文件
```

## 🎯 核心功能

### 用户角色

| 角色 | 权限 |
|------|------|
| 👤 **普通用户** | 浏览景点、评论、收藏、购买门票、预订酒店 |
| 🧭 **导游** | 浏览景点、查看游客信息、访问个人中心 |
| 👑 **管理员** | 管理所有数据（景点、门票、酒店、活动、新闻） |

### 数据统计

- 景点分类统计（折线图、柱状图）
- 订单统计分析
- 用户行为分析
- 热门景点排行

## 🚀 部署指南

### 本地部署

1. **克隆仓库**
   ```bash
   git clone <your-repo-url>
   cd kiro-travel
   ```

2. **使用启动脚本**
   ```bash
   # macOS/Linux
   ./start.sh

   # Windows
   start.bat
   ```

3. **手动部署**
   ```bash
   npm install
   npm run db:init
   npm run dev
   ```

### 生产环境部署

#### 使用启动脚本构建
```bash
# 选择选项 3 (生产模式) 或选项 12 (构建项目)
./start.sh  # macOS/Linux
start.bat   # Windows
```

#### 手动构建
```bash
npm run build
npm run start
```

### Vercel 部署（前端部署）

> ⚠️ **注意**: SQLite 在 Vercel 无服务器环境中不支持写入操作。仅适合静态/只读部署。

1. 将代码推送到 GitHub
2. 在 [Vercel](https://vercel.com) 导入项目
3. 配置构建命令: `npm run build`
4. 配置启动命令: `npm run start`
5. 点击部署

**对于需要数据库写入的功能**，建议：
- 使用 **Vercel Postgres** 或 **Vercel KV**
- 迁移到 **PostgreSQL** / **MySQL** 云数据库
- 使用 **Supabase** / **PlanetScale** / **Neon** 等云数据库服务

### Docker 部署（推荐生产环境）

```dockerfile
# Dockerfile 示例（需要创建）
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run db:init
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
# 构建和运行
docker build -t kiro-travel .
docker run -p 3000:3000 -v ./data:/app/data kiro-travel
```

## 📈 项目进度

### ✅ Phase 1: 基础架构（已完成）
- [x] 从 Supabase 迁移到 SQLite
- [x] JWT 认证系统实现
- [x] 数据库表结构设计和创建
- [x] 测试数据初始化
- [x] 跨平台启动脚本 (start.sh / start.bat)
- [x] API 端点基础框架

### ✅ Phase 2: 核心功能（已完成）
- [x] 用户认证流程 (登录/注册/JWT)
- [x] 景点浏览和搜索 API
- [x] 门票系统 API
- [x] 购物车功能 API
- [x] 订单管理 API
- [x] 酒店预订 API
- [x] 活动系统 API
- [x] 新闻系统 API
- [x] 收藏功能 API
- [x] 个人中心 Header 组件迁移

### ✅ Phase 3: 前端组件迁移（已完成）
- [x] Header 组件 (JWT 认证)
- [x] 购物车组件 (components/cart/cart-content.tsx)
- [x] 收藏列表组件 (components/favorites/favorites-list.tsx)
- [x] 订单组件 (components/orders/orders-list.tsx, order-detail.tsx)
- [x] 景点详情组件 (components/spots/spot-detail.tsx, spot-comments.tsx)
- [x] 酒店详情组件 (components/hotels/hotel-detail.tsx)
- [x] 个人资料组件 (components/profile/profile-content.tsx)
- [x] 预订列表组件 (components/bookings/bookings-list.tsx)
- [x] 门票列表组件 (components/tickets/tickets-list.tsx)
- [x] 统计组件 (components/statistics/statistics-content.tsx)
- [x] 统计 API 端点 (app/api/statistics/route.ts)

### ✅ Phase 4: 高级功能（已完成）
- [x] Excel 导出功能（统计数据导出为 .xlsx 文件）
- [x] 全文搜索优化（SQLite FTS5 索引）
- [x] 搜索性能提升（支持中文分词和多关键词）
- [x] 数据统计图表完善（柱状图、折线图、饼图）
- [ ] 图片上传功能
- [ ] 实时通知系统
- [ ] 支付集成

### 💡 Phase 5: 优化和扩展
- [ ] 性能优化 (代码分割、懒加载)
- [ ] SEO 优化 (meta 标签、sitemap)
- [ ] 移动端适配优化
- [ ] 国际化 (i18n)
- [ ] PWA 支持
- [ ] Docker 容器化

## 🤝 贡献指南

欢迎贡献！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🔗 相关链接

### 官方文档
- [Next.js 16 文档](https://nextjs.org/docs)
- [React 19 文档](https://react.dev/)
- [TypeScript 文档](https://www.typescriptlang.org/docs/)
- [SQLite 文档](https://sqlite.org/docs.html)
- [better-sqlite3 文档](https://github.com/WiseLibs/better-sqlite3/wiki)

### UI 和样式
- [Tailwind CSS 4 文档](https://tailwindcss.com/docs)
- [Radix UI 文档](https://www.radix-ui.com/docs/primitives/overview/introduction)
- [shadcn/ui 组件](https://ui.shadcn.com/)

### 认证和安全
- [JWT.io](https://jwt.io/)
- [bcryptjs](https://github.com/dcodeIO/bcrypt.js)

## 📞 联系方式

- 项目仓库: [GitHub](https://github.com/your-username/kiro-travel)
- 问题反馈: [Issues](https://github.com/your-username/kiro-travel/issues)
- 邮箱: your-email@example.com

## ⭐ Star History

如果这个项目对你有帮助，请给它一个 Star！⭐

---

## 🎉 开始使用

**首次使用前，请执行以下步骤：**

```bash
# 1. 克隆项目
git clone <your-repo-url>
cd kiro-travel

# 2. 运行启动脚本（推荐）
./start.sh       # macOS/Linux
start.bat        # Windows

# 或手动初始化
npm install
npm run db:init
npm run dev
```

**然后访问 [http://localhost:3000](http://localhost:3000) 开始体验！** 🚀

**默认管理员账号**: admin@example.com / admin123
