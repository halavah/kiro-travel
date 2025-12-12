# 🌍 旅游服务系统

基于 Next.js + SQLite 的现代化旅游服务平台，提供景点浏览、门票预订、酒店预订、旅游活动等全方位旅游服务。

![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19.2-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![SQLite](https://img.shields.io/badge/SQLite-5.1-003b57?style=flat-square&logo=sqlite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8?style=flat-square&logo=tailwind-css)

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

## 🚀 快速开始

### 一键启动（推荐）

```bash
# 克隆项目
git clone <your-repo-url>
cd kiro-travel

# 一键初始化（自动安装依赖和初始化数据库）
npm run setup

# 启动开发服务器
npm run dev
```

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

### 默认账户

系统初始化后会创建一个管理员账户：
- 邮箱：admin@example.com
- 密码：123456
- 角色：管理员

## 📚 文档

完整的项目文档请查看 [docs](docs/) 目录：

- **[📖 文档中心](docs/README.md)** - 文档总览
- **[📊 数据库结构](docs/DATABASE_SCHEMA.md)** - ER 图和表关系说明
- **[🔌 API 文档](docs/API_DOCUMENTATION.md)** - 完整的 API 端点文档

## 🏗️ 项目结构

```
travel-service-system/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── (auth)/            # 认证相关页面
│   └── (main)/            # 主要功能页面
├── components/            # React 组件
│   ├── ui/               # UI 基础组件（Radix UI）
│   └── ...               # 业务组件
├── lib/                   # 工具库
│   ├── sqlite.ts         # SQLite 数据库配置
│   └── utils.ts          # 工具函数
├── data/                  # SQLite 数据库文件
│   └── database.db       # SQLite 数据库
├── scripts/              # 数据库脚本
│   ├── init-sqlite.mjs   # 数据库初始化脚本
│   ├── 001_create_tables.sql      # 创建表结构
│   ├── 002_enable_rls.sql         # 启用行级安全（可选）
│   ├── 003_create_triggers.sql    # 创建触发器
│   └── 004_seed_data.sql          # 插入示例数据
├── docs/                 # 📚 完整文档
│   ├── README.md         # 文档中心
│   ├── DATABASE_SCHEMA.md # 数据库结构
│   └── API_DOCUMENTATION.md # API 文档
└── types/                # TypeScript 类型定义
```

## 🛠️ 技术栈

### 前端
- **Next.js 16** - React 框架
- **React 19** - UI 库
- **TypeScript** - 类型安全
- **Tailwind CSS 4** - 样式框架
- **Radix UI** - 无障碍 UI 组件
- **Recharts** - 数据可视化
- **React Hook Form** - 表单管理
- **Zod** - 数据验证

### 后端
- **Next.js API Routes** - RESTful API
- **Next.js Server Actions** - 服务端操作
- **SQLite** - 轻量级数据库
  - 本地文件数据库
  - 事务支持
  - 无需服务器配置

### 部署
- **Vercel** - 前端部署
- **本地 SQLite** - 数据库存储

## 📊 数据库架构

系统包含 **15 张核心数据表**：

- **用户系统**: profiles
- **景点系统**: spot_categories, spots, spot_comments, spot_favorites, spot_likes
- **门票系统**: tickets, cart_items, orders, order_items
- **酒店系统**: hotels, hotel_rooms, hotel_bookings
- **其他**: activities, news

详细的 ER 图和关系说明请查看 [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md)

## 🔐 安全特性

- ✅ 基于角色的访问控制（RBAC）
- ✅ JWT 令牌认证
- ✅ 安全的密码哈希
- ✅ HTTPS 加密传输
- ✅ SQL 注入防护（使用参数化查询）

## 📝 可用命令

```bash
# 开发
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run start        # 启动生产服务器
npm run lint         # 代码检查

# 数据库
npm run db:init      # 初始化数据库
npm run db:reset     # 重置数据库（删除并重新创建）
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

1. 安装依赖：`npm install`
2. 初始化数据库：`npm run db:init`
3. 启动开发服务器：`npm run dev`

### Vercel 部署

1. 将代码推送到 GitHub
2. 在 [Vercel](https://vercel.com) 导入项目
3. 配置构建命令：`npm run build`
4. 配置环境变量（如需要）
5. 点击部署

注意：在 Vercel 部署时，数据库将作为只读资源。如需写入功能，可考虑：
- 使用 Vercel KV 或其他云数据库服务
- 配置外部数据库连接

## 📈 开发路线图

### Phase 1: 基础功能 ✅
- [x] 数据库设计
- [x] SQL 脚本
- [x] RLS 安全策略
- [x] 完整文档

### Phase 2: 核心功能 🚧
- [ ] 用户认证流程
- [ ] 景点浏览和搜索
- [ ] 门票购买流程
- [ ] 酒店预订功能
- [ ] 个人中心

### Phase 3: 高级功能 📋
- [ ] 数据统计图表
- [ ] Excel 导出
- [ ] 支付集成
- [ ] 图片上传
- [ ] 实时通知
- [ ] 搜索优化

### Phase 4: 优化和扩展 💡
- [ ] 性能优化
- [ ] SEO 优化
- [ ] 移动端适配
- [ ] 国际化 (i18n)
- [ ] PWA 支持

## 🤝 贡献指南

欢迎贡献！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解��情

## 🔗 相关链接

- [Next.js 文档](https://nextjs.org/docs)
- [SQLite 文档](https://sqlite.org/docs.html)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [Radix UI 文档](https://www.radix-ui.com/docs)

## 📞 联系方式

- 项目��库: [GitHub](https://github.com/your-username/travel-service-system)
- 问题反馈: [Issues](https://github.com/your-username/travel-service-system/issues)

## ⭐ Star History

如果这个项目对你有帮助，请给它一个 Star！⭐

---

**开始开发前，请务必先运行 `npm run db:init` 初始化数据库！** 🚀
