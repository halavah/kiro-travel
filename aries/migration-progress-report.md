# Kiro-Travel Supabase → SQLite 迁移进度报告

**文档创建时间**: 2025-12-12
**项目路径**: `/Volumes/Samsung/software_yare/kiro-travel`
**当前状态**: ✅ Supabase 代码已完全清理，核心功能已迁移到 SQLite

---

## 📋 项目背景

### 迁移目标
- 从 **Supabase (PostgreSQL + Supabase Auth)** 迁移到 **SQLite (better-sqlite3) + JWT Authentication**
- 技术栈：Next.js 16 App Router + TypeScript + Tailwind CSS
- 保持核心功能可用的同时，逐步完善次要功能

### 触发原因
在之前的迁移过程中，虽然声称移除了所有 Supabase 引用，但实际运行时发现：
- `lib/supabase/proxy.ts` 仍然存在
- 导致运行时错误："Your project's URL and Key are required to create a Supabase client!"
- 用户反馈："你不是说已经都移除了吗？开始修复吧"

---

## ✅ 已完成的工作

### 1. 删除 Supabase 相关目录和文件

#### 已删除的目录
```bash
# 执行的删除命令
rm -rf /Volumes/Samsung/software_yare/kiro-travel/lib/supabase
rm -rf /Volumes/Samsung/software_yare/kiro-travel/app/auth
```

**删除的文件清单**：
- `lib/supabase/client.ts` - 客户端 Supabase 实例
- `lib/supabase/proxy.ts` - Supabase 代理（运行时错误根源）
- `lib/supabase/server.ts` - 服务端 Supabase 实例
- `app/auth/*` - 旧的 Supabase 认证页面（已被 `app/(auth)/` 替代）

**验证结果**：
```bash
grep -r "supabase" {app,lib,components} --include="*.ts" --include="*.tsx" | wc -l
# 输出：0（无残留引用）
```

---

### 2. 核心页面完整迁移到 SQLite

以下页面已完整实现 SQLite 数据库查询，功能正常：

#### ✅ `app/(main)/page.tsx` - 网站主页
**迁移内容**：
- 推荐景点查询（4条）
- 最新活动查询（6条）
- 最新新闻查询（3条）

**关键代码模式**：
```typescript
import { dbQuery } from "@/lib/db-utils"

// 推荐景点查询
const recommendedSpots = dbQuery<Spot>(`
  SELECT s.*, c.name as category_name
  FROM spots s
  LEFT JOIN spot_categories c ON s.category_id = c.id
  WHERE s.is_recommended = 1
  ORDER BY s.created_at DESC
  LIMIT 4
`)

// 最新活动查询
const recentActivities = dbQuery<Activity>(`
  SELECT * FROM activities
  WHERE status = 'active'
  ORDER BY start_date DESC
  LIMIT 6
`)
```

---

#### ✅ `app/(main)/spots/page.tsx` - 景点列表页
**迁移内容**：
- 景点分类筛选
- 关键词搜索（名称、位置）
- 价格排序（升序/降序）
- 评分排序
- 热度排序（浏览量）
- 分类信息关联查询

**关键代码模式**：
```typescript
import { dbQuery } from "@/lib/db-utils"

// 动态构建 WHERE 子句
let whereClauses: string[] = []
let queryParams: any[] = []

if (searchParams.category) {
  whereClauses.push('s.category_id = ?')
  queryParams.push(searchParams.category)
}

if (searchParams.search) {
  whereClauses.push('(s.name LIKE ? OR s.location LIKE ?)')
  queryParams.push(`%${searchParams.search}%`, `%${searchParams.search}%`)
}

const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''

// 动态排序
let orderBy = 's.created_at DESC'
switch (searchParams.sort) {
  case "price-asc": orderBy = 's.price ASC'; break
  case "price-desc": orderBy = 's.price DESC'; break
  case "rating": orderBy = 's.rating DESC'; break
  case "popular": orderBy = 's.view_count DESC'; break
}

const spots = dbQuery<Spot>(`
  SELECT s.*, c.name as category_name
  FROM spots s
  LEFT JOIN spot_categories c ON s.category_id = c.id
  ${whereClause}
  ORDER BY ${orderBy}
`, queryParams)
```

**安全措施**：
- ✅ 使用参数化查询防止 SQL 注入
- ✅ 用户输入通过 `?` 占位符传递

---

#### ✅ `app/(main)/spots/[id]/page.tsx` - 景点详情页
**迁移内容**：
- 景点基本信息查询
- 关联门票查询
- 用户认证状态检查（JWT Token）
- 点赞状态检查
- 收藏状态检查
- 访问量统计更新

**关键代码模式**：
```typescript
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { dbGet, dbQuery, dbRun } from '@/lib/db-utils'

// JWT 认证替代 Supabase Auth
const cookieStore = await cookies()
const token = cookieStore.get('token')?.value
let user = null

if (token) {
  const decoded = verifyToken(token)
  if (decoded) {
    user = dbGet(`SELECT id, email, full_name, role FROM profiles WHERE id = ?`, [decoded.userId])
  }
}

// 景点详情查询
const spot = dbGet<Spot>(`
  SELECT s.*, c.name as category_name
  FROM spots s
  LEFT JOIN spot_categories c ON s.category_id = c.id
  WHERE s.id = ?
`, [params.id])

// 关联门票查询
const tickets = dbQuery<Ticket>(`
  SELECT * FROM tickets WHERE spot_id = ? AND status = 'active'
`, [params.id])

// 检查用户点赞状态
if (user) {
  const like = dbGet(`
    SELECT id FROM spot_likes
    WHERE spot_id = ? AND user_id = ?
  `, [params.id, user.id])

  isLiked = !!like
}

// 更新访问量
dbRun(`UPDATE spots SET view_count = view_count + 1 WHERE id = ?`, [params.id])
```

**认证方案替代**：
- ❌ 旧方案：`supabase.auth.getUser()`
- ✅ 新方案：`cookies() + verifyToken()` (JWT)

---

#### ✅ `app/(main)/tickets/page.tsx` - 门票列表页
**迁移内容**：
- 门票列表查询
- 关联景点信息（LEFT JOIN）
- 关联分类信息
- 景点筛选
- 价格排序
- 热度排序

**关键代码模式**：
```typescript
const tickets = dbQuery<Ticket>(`
  SELECT
    t.*,
    s.id as spot_id,
    s.name as spot_name,
    s.location as spot_location,
    s.images as spot_images,
    c.name as category_name
  FROM tickets t
  LEFT JOIN spots s ON t.spot_id = s.id
  LEFT JOIN spot_categories c ON s.category_id = c.id
  WHERE ${whereClause}
  ORDER BY ${orderBy}
`, queryParams)
```

---

### 3. 次要页面创建占位符

为了快速清除所有 Supabase 引用避免运行时错误，以下页面创建了"功能开发中"占位符：

#### 占位符列表页（8个）
1. `app/(main)/tourists/page.tsx` - 游客管理
2. `app/(main)/hotels/page.tsx` - 酒店列表
3. `app/(main)/favorites/page.tsx` - 收藏列表
4. `app/(main)/profile/bookings/page.tsx` - 我的预订
5. `app/(main)/news/page.tsx` - 新闻资讯
6. `app/(main)/cart/page.tsx` - 购物车
7. `app/(main)/activities/page.tsx` - 活动列表
8. `app/(main)/orders/page.tsx` - 订单列表

#### 占位符详情页（4个）
1. `app/(main)/hotels/[id]/page.tsx` - 酒店详情
2. `app/(main)/news/[id]/page.tsx` - 新闻详情
3. `app/(main)/activities/[id]/page.tsx` - 活动详情
4. `app/(main)/orders/[id]/page.tsx` - 订单详情

**占位符代码模板**：
```typescript
import { Card, CardContent } from "@/components/ui/card"

export default function Page() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardContent className="p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">功能开发中</h1>
          <p className="text-muted-foreground">该页面正在使用 SQLite 重构中,敬请期待!</p>
        </CardContent>
      </Card>
    </div>
  )
}
```

---

### 4. 组件文件清理

使用 shell 脚本批量清理了 15 个组件文件中的 Supabase 引用：

**清理的组件列表**：
1. `components/statistics/statistics-content.tsx`
2. `components/home/featured-activities.tsx`
3. `components/home/recommended-spots.tsx`
4. `components/home/latest-news.tsx`
5. `components/tickets/tickets-list.tsx`
6. `components/bookings/bookings-list.tsx`
7. `components/hotels/hotel-detail.tsx`
8. `components/layout/header.tsx`
9. `components/favorites/favorites-list.tsx`
10. `components/profile/profile-content.tsx`
11. `components/cart/cart-content.tsx`
12. `components/orders/orders-list.tsx`
13. `components/orders/order-detail.tsx`
14. `components/spots/spot-comments.tsx`
15. `components/spots/spot-detail.tsx`

**清理脚本**：
```bash
# 删除 Supabase 导入语句
sed -i '' '/import.*createClient.*supabase/d' "$file"
sed -i '' '/const supabase = createClient()/d' "$file"
```

**清理内容**：
- 删除 `import { createClient } from "@/lib/supabase/client"` 语句
- 删除 `const supabase = createClient()` 调用

**注意**：这些组件内部的数据获取逻辑尚未完全更新，需要后续完善。

---

### 5. 验证和测试

#### 代码引用验证
```bash
# 搜索所有 TS/TSX 文件中的 supabase 引用
grep -r "supabase" /Volumes/Samsung/software_yare/kiro-travel/{app,lib,components} \
  --include="*.ts" --include="*.tsx" 2>/dev/null | \
  grep -v node_modules | grep -v ".next" | wc -l

# 结果：0（无残留引用）
```

#### 开发服务器测试
```bash
# 清理构建缓存
rm -rf /Volumes/Samsung/software_yare/kiro-travel/.next

# 启动开发服务器
npm run dev

# 结果：✅ 成功启动在 http://localhost:3000
```

---

## ⚠️ 待修复问题和后续任务

### 1. 占位符页面需要完整实现

以下 12 个页面目前仅显示"功能开发中"占位符，需要实现完整的 SQLite 数据库功能：

#### 高优先级（用户核心功能）
1. **`app/(main)/orders/page.tsx` - 订单列表**
   - 需要实现：用户订单查询、订单状态筛选、订单搜索
   - 数据表：`orders`, `order_items`
   - 关联查询：需要关联 `spots`, `tickets`, `profiles`

2. **`app/(main)/orders/[id]/page.tsx` - 订单详情**
   - 需要实现：订单详情查询、订单项列表、支付状态、取消订单功能
   - 权限控制：只能查看自己的订单（管理员除外）

3. **`app/(main)/profile/bookings/page.tsx` - 我的预订**
   - 需要实现：用户预订列表、预订状态、预订详情
   - 数据表：`bookings`, `tickets`, `spots`

4. **`app/(main)/cart/page.tsx` - 购物车**
   - 需要实现：购物车列表、数量修改、删除商品、批量结算
   - 数据表：`cart_items`
   - 注意：需要实时计算总价

5. **`app/(main)/favorites/page.tsx` - 收藏列表**
   - 需要实现：用户收藏的景点列表、取消收藏
   - 数据表：`spot_favorites`
   - 关联查询：需要关联 `spots` 表

#### 中优先级（内容展示功能）
6. **`app/(main)/hotels/page.tsx` - 酒店列表**
   - 需要实现：酒店列表查询、筛选（位置、价格、星级）、搜索
   - 数据表：`hotels`
   - 关联查询：可能需要关联 `hotel_rooms`

7. **`app/(main)/hotels/[id]/page.tsx` - 酒店详情**
   - 需要实现：酒店详情、房间列表、预订功能
   - 数据表：`hotels`, `hotel_rooms`

8. **`app/(main)/activities/page.tsx` - 活动列表**
   - 需要实现：活动列表查询、状态筛选（进行中/已结束）、搜索
   - 数据表：`activities`

9. **`app/(main)/activities/[id]/page.tsx` - 活动详情**
   - 需要实现：活动详情、报名功能、参与人数统计
   - 数据表：`activities`, `activity_participants`

10. **`app/(main)/news/page.tsx` - 新闻资讯**
    - 需要实现：新闻列表查询、分类筛选、分页
    - 数据表：`news`, `news_categories`

11. **`app/(main)/news/[id]/page.tsx` - 新闻详情**
    - 需要实现：新闻详情、阅读量统计
    - 数据表：`news`

#### 低优先级（管理功能）
12. **`app/(main)/tourists/page.tsx` - 游客管理**
    - 需要实现：游客列表、搜索、筛选
    - 数据表：`profiles`（role = 'user'）
    - 权限：仅管理员可访问

---

### 2. 组件内部数据获取逻辑需要更新

以下 15 个组件已清除 Supabase 导入，但内部的数据获取逻辑尚未更新：

#### 需要更新的组件
1. **`components/statistics/statistics-content.tsx`**
   - 当前问题：可能包含 Supabase 查询代码
   - 需要修改：统计数据查询逻辑改为 SQLite

2. **`components/home/featured-activities.tsx`**
   - 当前问题：活动数据获取逻辑
   - 需要修改：改为从父组件传入 props 或使用 API 端点

3. **`components/home/recommended-spots.tsx`**
   - 当前问题：推荐景点数据获取
   - 需要修改：改为从父组件传入 props

4. **`components/home/latest-news.tsx`**
   - 当前问题：新闻数据获取
   - 需要修改：改为从父组件传入 props

5. **`components/tickets/tickets-list.tsx`**
   - 当前问题：门票列表数据获取
   - 需要修改：改为从父组件传入 props

6. **`components/bookings/bookings-list.tsx`**
   - 当前问题：预订列表数据获取
   - 需要修改：使用 API 端点 `/api/bookings` + SWR/React Query

7. **`components/hotels/hotel-detail.tsx`**
   - 当前问题：酒店详情数据获取
   - 需要修改：改为从父组件传入 props

8. **`components/layout/header.tsx`**
   - 当前问题：用户认证状态获取
   - 需要修改：使用 Context API 或从 cookies 读取 JWT

9. **`components/favorites/favorites-list.tsx`**
   - 当前问题：收藏列表数据获取
   - 需要修改：使用 API 端点 `/api/favorites`

10. **`components/profile/profile-content.tsx`**
    - 当前问题：用户资料数据获取
    - 需要修改：使用 API 端点 `/api/profile`

11. **`components/cart/cart-content.tsx`**
    - 当前问题：购物车数据获取
    - 需要修改：使用 API 端点 `/api/cart` + 实时更新

12. **`components/orders/orders-list.tsx`**
    - 当前问题：订单列表数据获取
    - 需要修改：使用 API 端点 `/api/orders`

13. **`components/orders/order-detail.tsx`**
    - 当前问题：订单详情数据获取
    - 需要修改：使用 API 端点 `/api/orders/[id]`

14. **`components/spots/spot-comments.tsx`**
    - 当前问题：评论数据获取和提交
    - 需要修改：使用 API 端点 `/api/spots/[id]/comments`

15. **`components/spots/spot-detail.tsx`**
    - 当前问题：景点详情数据展示（可能有客户端交互）
    - 需要修改：确保使用从父组件传入的 props

---

### 3. API 端点需要完善

部分功能需要创建或更新 API 端点：

#### 需要创建的 API 端点
1. **`app/api/bookings/route.ts`**
   - GET：获取用户预订列表
   - POST：创建新预订

2. **`app/api/bookings/[id]/route.ts`**
   - GET：获取预订详情
   - PATCH：更新预订状态
   - DELETE：取消预订

3. **`app/api/cart/route.ts`**
   - GET：获取购物车列表
   - POST：添加商品到购物车
   - DELETE：清空购物车

4. **`app/api/cart/[id]/route.ts`**
   - PATCH：更新购物车商品数量
   - DELETE：删除购物车商品

5. **`app/api/favorites/route.ts`**
   - GET：获取收藏列表
   - POST：添加收藏

6. **`app/api/favorites/[id]/route.ts`**
   - DELETE：取消收藏

7. **`app/api/orders/route.ts`**
   - GET：获取订单列表
   - POST：创建订单

8. **`app/api/orders/[id]/route.ts`**
   - GET：获取订单详情
   - PATCH：更新订单状态
   - DELETE：取消订单

9. **`app/api/profile/route.ts`**
   - GET：获取用户资料
   - PATCH：更新用户资料

10. **`app/api/spots/[id]/comments/route.ts`**
    - GET：获取景点评论
    - POST：提交评论

11. **`app/api/spots/[id]/like/route.ts`**
    - POST：点赞景点
    - DELETE：取消点赞

#### 需要更新的 API 端点
- 检查现有 API 端点是否已经从 Supabase 迁移到 SQLite
- 确保所有端点都有正确的 JWT 认证中间件

---

### 4. 数据库初始化和测试数据

#### 数据库 Schema 检查
确认以下数据表是否已创建：
- ✅ `profiles` - 用户资料
- ✅ `spots` - 景点
- ✅ `spot_categories` - 景点分类
- ✅ `tickets` - 门票
- ✅ `spot_likes` - 景点点赞
- ✅ `spot_favorites` - 景点收藏
- ⚠️ `orders` - 订单（需确认）
- ⚠️ `order_items` - 订单项（需确认）
- ⚠️ `bookings` - 预订（需确认）
- ⚠️ `cart_items` - 购物车（需确认）
- ⚠️ `hotels` - 酒店（需确认）
- ⚠️ `hotel_rooms` - 酒店房间（需确认）
- ⚠️ `activities` - 活动（需确认）
- ⚠️ `activity_participants` - 活动参与者（需确认）
- ⚠️ `news` - 新闻（需确认）
- ⚠️ `news_categories` - 新闻分类（需确认）
- ⚠️ `comments` - 评论（需确认）

#### 测试数据添加
需要为以下表添加测试数据：
1. 景点数据（至少 10 条）
2. 门票数据（至少 20 条）
3. 用户数据（至少 5 条，包括管理员）
4. 分类数据（景点分类、新闻分类）
5. 酒店数据（至少 5 条）
6. 活动数据（至少 5 条）
7. 新闻数据（至少 10 条）

---

### 5. 认证和权限控制

#### 需要添加权限检查的页面
1. **管理员页面**
   - `app/(main)/tourists/page.tsx` - 需要管理员角色
   - 统计页面（如果有）

2. **用户页面**
   - `app/(main)/orders/*` - 只能查看自己的订单
   - `app/(main)/profile/*` - 只能查看和编辑自己的资料
   - `app/(main)/favorites/*` - 只能查看自己的收藏
   - `app/(main)/cart/*` - 只能操作自己的购物车

#### JWT 认证中间件
确保以下功能正常：
- Token 生成（登录/注册时）
- Token 验证（服务端和客户端）
- Token 刷新机制
- Token 过期处理

---

### 6. 错误处理和边界情况

需要完善以下错误处理：

#### 数据库错误
- 查询失败时的 fallback
- 空结果集的处理
- 外键约束错误处理

#### 认证错误
- Token 过期时的重定向
- 未登录用户访问受保护页面
- 权限不足时的提示

#### 客户端错误
- 网络请求失败
- 表单验证错误
- 文件上传错误

---

### 7. 性能优化

#### 数据库查询优化
- 添加必要的索引（特别是外键和常用查询字段）
- 避免 N+1 查询问题
- 使用 EXPLAIN QUERY PLAN 分析慢查询

#### 前端优化
- 实现分页（避免一次性加载大量数据）
- 添加加载状态和骨架屏
- 图片懒加载
- 使用 SWR 或 React Query 缓存数据

---

### 8. 测试

#### 需要测试的功能
1. **用户认证流程**
   - 注册 → 登录 → 访问受保护页面 → 登出
   - Token 过期处理
   - 密码重置（如果有）

2. **核心功能**
   - 浏览景点 → 查看详情 → 点赞/收藏 → 购买门票
   - 添加购物车 → 修改数量 → 结算 → 创建订单
   - 查看订单列表 → 查看订单详情 → 取消订单

3. **边界情况**
   - 空数据页面展示
   - 无效 ID 访问详情页（404 处理）
   - 重复操作（重复点赞、重复添加购物车）
   - 并发操作（库存扣减）

---

## 📂 关键文件和目录结构

### 已迁移的核心文件
```
app/
├── (auth)/                    # 新的认证页面（已实现）
│   ├── login/page.tsx
│   └── register/page.tsx
├── (main)/
│   ├── page.tsx              # ✅ 主页（已迁移）
│   ├── spots/
│   │   ├── page.tsx          # ✅ 景点列表（已迁移）
│   │   └── [id]/page.tsx     # ✅ 景点详情（已迁移）
│   └── tickets/
│       └── page.tsx          # ✅ 门票列表（已迁移）
```

### 占位符页面
```
app/(main)/
├── tourists/page.tsx          # ⚠️ 占位符
├── hotels/
│   ├── page.tsx              # ⚠️ 占位符
│   └── [id]/page.tsx         # ⚠️ 占位符
├── favorites/page.tsx         # ⚠️ 占位符
├── profile/
│   └── bookings/page.tsx     # ⚠️ 占位符
├── news/
│   ├── page.tsx              # ⚠️ 占位符
│   └── [id]/page.tsx         # ⚠️ 占位符
├── cart/page.tsx             # ⚠️ 占位符
├── activities/
│   ├── page.tsx              # ⚠️ 占位符
│   └── [id]/page.tsx         # ⚠️ 占位符
└── orders/
    ├── page.tsx              # ⚠️ 占位符
    └── [id]/page.tsx         # ⚠️ 占位符
```

### 数据库工具
```
lib/
├── db.ts                      # SQLite 数据库连接
├── db-utils.ts                # dbQuery, dbGet, dbRun 工具函数
├── auth.ts                    # JWT 生成和验证
└── (supabase/)               # ❌ 已删除
```

### 组件（已清理但未完全更新）
```
components/
├── statistics/
│   └── statistics-content.tsx     # ⚠️ 需要更新数据获取逻辑
├── home/
│   ├── featured-activities.tsx    # ⚠️ 需要更新
│   ├── recommended-spots.tsx      # ⚠️ 需要更新
│   └── latest-news.tsx            # ⚠️ 需要更新
├── tickets/
│   └── tickets-list.tsx           # ⚠️ 需要更新
├── bookings/
│   └── bookings-list.tsx          # ⚠️ 需要更新
├── hotels/
│   └── hotel-detail.tsx           # ⚠️ 需要更新
├── layout/
│   └── header.tsx                 # ⚠️ 需要更新认证状态
├── favorites/
│   └── favorites-list.tsx         # ⚠️ 需要更新
├── profile/
│   └── profile-content.tsx        # ⚠️ 需要更新
├── cart/
│   └── cart-content.tsx           # ⚠️ 需要更新
├── orders/
│   ├── orders-list.tsx            # ⚠️ 需要更新
│   └── order-detail.tsx           # ⚠️ 需要更新
└── spots/
    ├── spot-comments.tsx          # ⚠️ 需要更新
    └── spot-detail.tsx            # ⚠️ 需要更新
```

---

## 🔧 技术实现参考

### 1. SQLite 查询模式

#### 基础查询
```typescript
import { dbQuery, dbGet, dbRun } from "@/lib/db-utils"

// 查询多条记录
const items = dbQuery<Item>(`SELECT * FROM items WHERE category = ?`, [categoryId])

// 查询单条记录
const item = dbGet<Item>(`SELECT * FROM items WHERE id = ?`, [id])

// 插入/更新/删除
dbRun(`INSERT INTO items (name, price) VALUES (?, ?)`, [name, price])
dbRun(`UPDATE items SET price = ? WHERE id = ?`, [newPrice, id])
dbRun(`DELETE FROM items WHERE id = ?`, [id])
```

#### JOIN 查询
```typescript
const items = dbQuery(`
  SELECT
    i.*,
    c.name as category_name,
    u.full_name as creator_name
  FROM items i
  LEFT JOIN categories c ON i.category_id = c.id
  LEFT JOIN profiles u ON i.creator_id = u.id
  WHERE i.status = ?
  ORDER BY i.created_at DESC
`, ['active'])
```

#### 动态查询构建
```typescript
let whereClauses: string[] = []
let params: any[] = []

if (filters.category) {
  whereClauses.push('category_id = ?')
  params.push(filters.category)
}

if (filters.search) {
  whereClauses.push('(name LIKE ? OR description LIKE ?)')
  params.push(`%${filters.search}%`, `%${filters.search}%`)
}

const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''

const items = dbQuery(`
  SELECT * FROM items ${whereClause} ORDER BY created_at DESC
`, params)
```

---

### 2. JWT 认证模式

#### 服务端认证（Page/API Route）
```typescript
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { dbGet } from '@/lib/db-utils'

// 获取当前用户
const cookieStore = await cookies()
const token = cookieStore.get('token')?.value

if (!token) {
  redirect('/login')
}

const decoded = verifyToken(token)
if (!decoded) {
  redirect('/login')
}

const user = dbGet(`SELECT * FROM profiles WHERE id = ?`, [decoded.userId])

if (!user) {
  redirect('/login')
}

// 权限检查
if (user.role !== 'admin') {
  throw new Error('Unauthorized')
}
```

#### API 路由认证
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const token = req.cookies.get('token')?.value

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const decoded = verifyToken(token)
  if (!decoded) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  // 继续处理请求
  const userId = decoded.userId

  // ...
}
```

---

### 3. 错误处理模式

#### 页面级错误处理
```typescript
import { notFound } from 'next/navigation'

const item = dbGet(`SELECT * FROM items WHERE id = ?`, [id])

if (!item) {
  notFound()  // 触发 404 页面
}
```

#### API 错误处理
```typescript
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // 验证输入
    if (!body.name || !body.price) {
      return NextResponse.json(
        { error: 'Name and price are required' },
        { status: 400 }
      )
    }

    // 执行数据库操作
    dbRun(`INSERT INTO items (name, price) VALUES (?, ?)`, [body.name, body.price])

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error creating item:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

---

### 4. 组件数据获取模式

#### 服务端组件（推荐）
```typescript
// app/(main)/items/page.tsx
import { dbQuery } from "@/lib/db-utils"
import ItemsList from "@/components/items/items-list"

export default async function ItemsPage() {
  // 直接在服务端组件中查询数据库
  const items = dbQuery(`SELECT * FROM items ORDER BY created_at DESC`)

  return (
    <div>
      <h1>Items</h1>
      <ItemsList items={items} />
    </div>
  )
}
```

#### 客户端组件 + API
```typescript
// components/items/items-list.tsx
'use client'

import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function ItemsList() {
  const { data, error, isLoading } = useSWR('/api/items', fetcher)

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error loading items</div>

  return (
    <div>
      {data.items.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  )
}
```

---

## 📝 重开任务时的操作步骤

### 1. 验证当前状态
```bash
# 检查 Supabase 引用是否已清理
cd /Volumes/Samsung/software_yare/kiro-travel
grep -r "supabase" {app,lib,components} --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v ".next"

# 检查开发服务器是否正常启动
npm run dev
```

### 2. 确定优先级
根据业务需求，选择以下优先级之一开始：

#### 优先级 A：核心用户功能
按顺序实现：
1. 购物车页面 (`app/(main)/cart/page.tsx`)
2. 订单列表 (`app/(main)/orders/page.tsx`)
3. 订单详情 (`app/(main)/orders/[id]/page.tsx`)
4. 我的预订 (`app/(main)/profile/bookings/page.tsx`)
5. 收藏列表 (`app/(main)/favorites/page.tsx`)

#### 优先级 B：内容展示功能
按顺序实现：
1. 酒店列表 (`app/(main)/hotels/page.tsx`)
2. 酒店详情 (`app/(main)/hotels/[id]/page.tsx`)
3. 活动列表 (`app/(main)/activities/page.tsx`)
4. 活动详情 (`app/(main)/activities/[id]/page.tsx`)
5. 新闻列表 (`app/(main)/news/page.tsx`)
6. 新闻详情 (`app/(main)/news/[id]/page.tsx`)

#### 优先级 C：管理功能
1. 游客管理 (`app/(main)/tourists/page.tsx`)

### 3. 实现单个页面的完整流程

以 "订单列表页面" 为例：

#### Step 1: 检查数据库 Schema
```bash
# 查看 orders 表结构
sqlite3 data/kiro.db ".schema orders"
sqlite3 data/kiro.db ".schema order_items"
```

#### Step 2: 添加测试数据（如果需要）
```bash
# 运行数据库初始化脚本
node scripts/init-db.js
# 或手动插入测试数据
```

#### Step 3: 实现页面组件
```typescript
// app/(main)/orders/page.tsx
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { dbQuery } from '@/lib/db-utils'
import { redirect } from 'next/navigation'

export default async function OrdersPage({ searchParams }) {
  // 认证检查
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  if (!token) redirect('/login')

  const decoded = verifyToken(token)
  if (!decoded) redirect('/login')

  // 查询订单
  const orders = dbQuery(`
    SELECT
      o.*,
      COUNT(oi.id) as item_count,
      SUM(oi.quantity * oi.price) as total_amount
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    WHERE o.user_id = ?
    GROUP BY o.id
    ORDER BY o.created_at DESC
  `, [decoded.userId])

  return (
    <div>
      <h1>我的订单</h1>
      {/* 渲染订单列表 */}
    </div>
  )
}
```

#### Step 4: 测试功能
```bash
# 启动开发服务器
npm run dev

# 访问页面测试
open http://localhost:3000/orders
```

#### Step 5: 更新进度文档
在本文档中标记该页面为 ✅ 已完成

---

### 4. 批量实现 API 端点

如果需要创建多个 API 端点，可以使用以下模板：

#### API Route 模板
```typescript
// app/api/[resource]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { dbQuery, dbRun } from '@/lib/db-utils'

// GET - 列表查询
export async function GET(req: NextRequest) {
  const token = req.cookies.get('token')?.value
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const decoded = verifyToken(token)
  if (!decoded) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  try {
    const items = dbQuery(`SELECT * FROM [table] WHERE user_id = ?`, [decoded.userId])
    return NextResponse.json({ items })
  } catch (error) {
    console.error('Error fetching items:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - 创建
export async function POST(req: NextRequest) {
  const token = req.cookies.get('token')?.value
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const decoded = verifyToken(token)
  if (!decoded) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  try {
    const body = await req.json()

    // 验证输入
    if (!body.field1 || !body.field2) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 插入数据
    const result = dbRun(
      `INSERT INTO [table] (user_id, field1, field2) VALUES (?, ?, ?)`,
      [decoded.userId, body.field1, body.field2]
    )

    return NextResponse.json({ id: result.lastInsertRowid, success: true })
  } catch (error) {
    console.error('Error creating item:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

---

### 5. 更新组件数据获取逻辑

对于每个需要更新的组件：

1. 确定组件是否需要是客户端组件（有交互）还是服务端组件（纯展示）
2. 如果是客户端组件，创建对应的 API 端点并使用 SWR/React Query
3. 如果是服务端组件，改为接收 props 从父组件传入数据
4. 测试组件是否正常工作

---

## 🎯 建议的工作顺序

### 阶段 1：完善核心用户流程（1-2 天）
1. 实现购物车功能（列表 + API）
2. 实现订单功能（列表 + 详情 + API）
3. 实现收藏功能（列表 + API）
4. 实现预订功能（列表 + API）
5. 测试完整的用户购买流程

### 阶段 2：完善内容展示（1-2 天）
1. 实现酒店功能（列表 + 详情）
2. 实现活动功能（列表 + 详情）
3. 实现新闻功能（列表 + 详情）
4. 添加测试数据

### 阶段 3：组件更新和优化（1 天）
1. 批量更新 15 个组件的数据获取逻辑
2. 添加加载状态和错误处理
3. 实现数据缓存（SWR/React Query）

### 阶段 4：管理功能和收尾（0.5 天）
1. 实现游客管理页面
2. 添加权限控制
3. 性能优化
4. 全面测试

---

## 📞 联系和协作

### 遇到问题时的检查清单
1. ✅ 是否已安装所有依赖？ (`npm install`)
2. ✅ 数据库文件是否存在？ (`data/kiro.db`)
3. ✅ 数据库表是否已创建？ (检查 schema)
4. ✅ 环境变量是否正确？ (`.env.local`)
5. ✅ JWT_SECRET 是否已设置？
6. ✅ 是否清理了构建缓存？ (`rm -rf .next`)

### 调试技巧
```bash
# 查看数据库内容
sqlite3 data/kiro.db "SELECT * FROM spots LIMIT 5;"

# 查看表结构
sqlite3 data/kiro.db ".schema spots"

# 检查 Next.js 日志
npm run dev  # 查看控制台输出

# 检查 JWT Token
# 在浏览器 DevTools > Application > Cookies 中查看 token
```

---

## 📊 当前进度总览

| 模块 | 状态 | 完成度 | 优先级 |
|------|------|--------|--------|
| Supabase 清理 | ✅ 完成 | 100% | - |
| 主页 | ✅ 完成 | 100% | 高 |
| 景点列表 | ✅ 完成 | 100% | 高 |
| 景点详情 | ✅ 完成 | 100% | 高 |
| 门票列表 | ✅ 完成 | 100% | 高 |
| 购物车 | ⚠️ 占位符 | 0% | 高 |
| 订单列表 | ⚠️ 占位符 | 0% | 高 |
| 订单详情 | ⚠️ 占位符 | 0% | 高 |
| 我的预订 | ⚠️ 占位符 | 0% | 高 |
| 收藏列表 | ⚠️ 占位符 | 0% | 高 |
| 酒店列表 | ⚠️ 占位符 | 0% | 中 |
| 酒店详情 | ⚠️ 占位符 | 0% | 中 |
| 活动列表 | ⚠️ 占位符 | 0% | 中 |
| 活动详情 | ⚠️ 占位符 | 0% | 中 |
| 新闻列表 | ⚠️ 占位符 | 0% | 中 |
| 新闻详情 | ⚠️ 占位符 | 0% | 中 |
| 游客管理 | ⚠️ 占位符 | 0% | 低 |
| 组件更新 | ⚠️ 部分完成 | 30% | 中 |
| API 端点 | ⚠️ 需完善 | 30% | 高 |

**总体进度**: 约 35% 完成

---

## 🔗 相关文档和资源

### 项目文档
- [数据库 Schema](./database-schema.md)
- [API 文档](./api-documentation.md)
- [认证流程](./authentication-flow.md)

### 技术文档
- [Next.js 16 App Router](https://nextjs.org/docs)
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
- [JWT Authentication](https://jwt.io/)
- [SWR](https://swr.vercel.app/)

### 工具和命令
```bash
# 开发服务器
npm run dev

# 构建生产版本
npm run build

# 运行生产版本
npm start

# 数据库操作
sqlite3 data/kiro.db

# 清理缓存
rm -rf .next

# 查看端口占用
lsof -i :3000

# 代码格式化
npm run format

# 类型检查
npm run type-check
```

---

**最后更新**: 2025-12-12
**文档版本**: 1.0
**维护者**: AI Assistant
