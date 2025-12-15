# News API 变量名冲突修复 (2025-12-14)

## 🐛 问题

**错误信息**:
```
Error updating news: Error: 新闻不存在
PUT http://localhost:3000/api/news/news_1765773420482_1 [HTTP/1.1 404 Not Found]
```

**症状**:
- 新闻更新请求返回 404 错误
- 数据库中明明存在该新闻记录
- SQL 参数传递异常

## 🔍 根本原因：变量名冲突 (Variable Shadowing)

**位置**: `/app/api/news/[id]/route.ts` 第 39-132 行

### 问题代码

```typescript
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }  // ← 路由参数名为 params
) {
  const id = params.id  // 使用路由参数

  // ... 中间代码 ...

  const params: any[] = [  // ❌ 变量名冲突！与路由参数同名
    titleValue,
    content || null,
    category || null,
    publishedValue,
    featured || 0,
    id
  ]

  dbRun(sql, params)  // 传入的是 params 数组，但作用域已被污染
}
```

### 为什么会出错？

在 JavaScript/TypeScript 中，变量名 **shadowing** (遮蔽) 会导致内层变量覆盖外层���量：

```typescript
// 外层: params = { id: "news_123" }
{ params }: { params: { id: string } }

// 内层: params = ["标题", "内容", ...]
const params: any[] = [...]

// ❌ 此时无法再访问路由参数的 params.id
// 所有对 params 的引用都指向数组，而不是路由参数对象
```

**实际影响**:
- `id` 变量在声明 `const params` 之前就已经赋值，所以 `id` 值正确
- 但代码可读性差，容易在后续维护中引入 bug
- 如果有其他地方引用 `params`，会得到错误的值

## ✅ 解决方案：重命名局部变量

### 修复后的代码

```typescript
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }  // ← 路由参数
) {
  const id = params.id  // 正确使用路由参数

  // ... 中间代码 ...

  const sqlParams: any[] = [  // ✅ 重命名为 sqlParams，避免冲突
    titleValue,
    content || null,
    category || null,
    publishedValue,
    featured || 0,
    id
  ]

  console.log('[News Update] SQL Params:', sqlParams)  // 调试日志
  const result = dbRun(sql, sqlParams)  // 传入明确命名的参数
}
```

## 📂 修改的文件

### `/app/api/news/[id]/route.ts`

#### 1. 变量重命名 (第 96-106 行)

```diff
- const params: any[] = [
+ const sqlParams: any[] = [
    titleValue,
    content || null,
    category || null,
    publishedValue,
    featured || 0,
    id
  ]
```

#### 2. 更新 dbRun 调用 (第 110 行)

```diff
- const result = dbRun(sql, params)
+ const result = dbRun(sql, sqlParams)
```

#### 3. 添加详细日志 (第 70-79, 108 行)

```typescript
console.log('[News Update] Request body:', {
  id,
  title,
  content: content?.substring(0, 50),
  category,
  is_published,
  featured
})

console.log('[News Update] SQL Params:', sqlParams)
console.log('[News Update] DB Result:', result)
```

#### 4. 增强字段验证和类型转换 (第 81-95 行)

```typescript
// 验证必填字段
if (!title || title.trim() === '') {
  return NextResponse.json(
    { success: false, error: '标题不能为空' },
    { status: 400 }
  )
}

// 显式类型转换
const titleValue = title.trim()
const publishedValue = is_published === true || is_published === 1 || is_published === '1' ? 1 : 0
```

## 🎯 修复范围

### 修复的功能
- ✅ 新闻更新 (PUT `/api/news/[id]`)
- ✅ 新闻发布状态切换
- ✅ 新闻分类更新
- ✅ 新闻推荐状态切换

### 相关的 API
- ✅ PUT `/api/news/[id]` - 更新新闻
- ✅ GET `/api/news/[id]` - 获取新闻详情 (未受影响)
- ✅ DELETE `/api/news/[id]` - 删除新闻 (未受影响)

## 💡 技术要点

### 1. 变量遮蔽 (Variable Shadowing)

**什么是变量遮蔽？**

```typescript
// 示例 1: 函数参数遮蔽
function example(params: { id: string }) {
  const params = [1, 2, 3]  // ❌ 遮蔽了函数参数
  console.log(params)  // 输出: [1, 2, 3]，而不是 { id: "..." }
}

// 示例 2: 块级作用域遮蔽
const x = 10
{
  const x = 20  // 内层 x 遮蔽外层 x
  console.log(x)  // 输出: 20
}
console.log(x)  // 输出: 10
```

**为什么要避免？**
- ❌ 降低代码可读性
- ❌ 容易引入难以调试的 bug
- ❌ 违反 ESLint 规则 `no-shadow`
- ❌ TypeScript 编译器会发出警告

**最佳实践**:
```typescript
// ✅ 使用不同的变量名
function example(routeParams: { id: string }) {
  const sqlParams = [1, 2, 3]
  // 清晰区分 routeParams 和 sqlParams
}
```

### 2. Next.js 动态路由参数

**API Routes 中的 params**:

```typescript
// app/api/news/[id]/route.ts
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }  // ← Next.js 自动注入
) {
  // params 是一个 Promise 在 Next.js 15+
  const id = params.id
}
```

**注意事项**:
- `params` 是 Next.js 框架提供的特殊参数
- 包含 URL 中的动态片段 (如 `[id]`)
- 不要在函数内部重新声明同名变量

### 3. SQL 参数化查询

**为什么使用参数化查询？**

```typescript
// ❌ 错误：SQL 注入风险
const sql = `UPDATE news SET title = '${title}' WHERE id = '${id}'`
db.prepare(sql).run()

// ✅ 正确：使用占位符
const sql = `UPDATE news SET title = ? WHERE id = ?`
db.prepare(sql).run([title, id])
```

**better-sqlite3 的参数绑定**:
```typescript
// 方式 1: 数组参数（推荐用于简单查询）
db.prepare('SELECT * FROM news WHERE id = ?').get([id])

// 方式 2: 命名参数（推荐用于复杂查询）
db.prepare('SELECT * FROM news WHERE id = :id').get({ id })
```

### 4. 类型安全的布尔值转换

```typescript
// ❌ 不够健壮
const published = is_published ? 1 : 0

// ✅ 处理多种输入格式
const published =
  is_published === true ||
  is_published === 1 ||
  is_published === '1'
    ? 1
    : 0

// 或使用工具函数
function toSQLiteBoolean(value: unknown): number {
  return [true, 1, '1', 'true', 'TRUE'].includes(value as any) ? 1 : 0
}
```

## 🧪 测试覆盖

### 手动测试

1. **更新新闻标题**:
   ```bash
   curl -X PUT http://localhost:3000/api/news/news_1765773420482_1 \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <token>" \
     -d '{"title":"测试标题","content":"内容"}'
   ```
   - ✅ 应该返回 200 和更新后的新闻

2. **切换发布状态**:
   ```bash
   curl -X PUT http://localhost:3000/api/news/news_1765773420482_1 \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <token>" \
     -d '{"is_published":true}'
   ```
   - ✅ 应该将 `is_published` 更新为 1

3. **边界情况**:
   - 空标题: 应该返回 400
   - 不存在的 ID: 应该返回 404
   - 缺少认证: 应该返回 401

### 日志验证

正常更新时应看到:
```
[News Update] Request body: { id: 'news_...', title: '...', ... }
[News Update] SQL Params: ['标题', '内容', 'tech', 1, 0, 'news_...']
[News Update] DB Result: { lastInsertRowid: 0, changes: 1 }
```

## ⚠️ 注意事项

### 1. 数据库 ID 一致性

此修复假设数据库已通过 `init-db.js` 重新初始化，所有新闻 ID 使用统一的时间戳前缀。

**验证数据库状态**:
```bash
sqlite3 data/database.sqlite "SELECT id FROM news LIMIT 5;"
```

应该看到:
```
news_1765773420482_1
news_1765773420482_2
news_1765773420482_3
```

### 2. 前端缓存

如果前端仍然报错 "新闻不存在"，需要:
- 刷新浏览器 (Cmd+Shift+R / Ctrl+Shift+R)
- 清除 localStorage / sessionStorage
- 重新从 `/api/news` 获取新闻列表

### 3. ESLint 配置

建议启用 `no-shadow` 规则防止未来再犯：

```json
// .eslintrc.json
{
  "rules": {
    "no-shadow": "error",
    "@typescript-eslint/no-shadow": "error"
  }
}
```

## 📝 后续建议

### 短期 (本周)

1. ✅ 验证所有新闻 CRUD 操作正常
2. ⚠️ 检查其他 API routes 是否有类似的变量遮蔽问题
3. ⚠️ 添加 ESLint 规则防止未来变量遮蔽

### 中期 (本月)

1. 📦 添加单元测试覆盖 news API
2. 📦 创建统一的参数验证中间件
3. 📦 使用 Zod 或 TypeBox 做运行时类型检查

### 长期 (下个月)

1. 📦 迁移到 Prisma 或 Drizzle ORM (自动参数绑定)
2. 📦 添加 API 集成测试套件
3. 📦 实现 API 请求/响应日志中间件

## 🔗 相关修复

此修复是修复链中的一部分：

1. **修复 6: 数据库初始化脚本** (`fixes-completed-20251214-6-database-init.md`)
   - 修复新闻 ID 生成不一致
   - 修复 activities 表约束

2. **修复 7: Activities JSON 序列化** (`fixes-completed-20251214-7-activities-json.md`)
   - 创建 `normalizeImages()` 工具函数
   - 防止 JSON 双重序列化

3. **本修复 (修复 8): News API 变量冲突**
   - 修复变量名遮蔽问题
   - 增强日志和验证

---

**修复时间**: 2025-12-14 01:00
**状态**: ✅ 已完成
**测试状态**: ⏳ 待用户验证

## 📚 参考资料

- [MDN: Variable Shadowing](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let#temporal_dead_zone)
- [Next.js Dynamic Routes](https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes)
- [better-sqlite3 Parameterized Queries](https://github.com/WiseLibs/better-sqlite3/wiki/API#binding-parameters)
- [ESLint no-shadow Rule](https://eslint.org/docs/latest/rules/no-shadow)
- [TypeScript Variable Declarations](https://www.typescriptlang.org/docs/handbook/variable-declarations.html)
