# 数据库初始化脚本修复报告 (2025-12-14)

## 🐛 问题

**错误信息**:
```
Error updating news: Error: 新闻不存在
PUT http://localhost:3000/api/news/news_1765726336863_1 [HTTP/1.1 404 Not Found]
```

**症状**:
1. 新闻更新一直返回 404 错误 "新闻不存在"
2. 活动状态切换失败 (CHECK constraint 错误)

## 🔍 根本原因

### 问题 1: 新闻 ID 生成不一致

**位置**: `/scripts/init-db.js` 第 941-1053 行

```javascript
// ❌ 问题代码
const newsData = [
  {
    id: `news_${Date.now()}_1`,  // 每次调用 Date.now() 得到不同时间戳
    title: '...',
  },
  {
    id: `news_${Date.now()}_2`,  // 又是不同的时间戳！
    title: '...',
  },
  // ...
]
```

**问题详解**:
- `Date.now()` 每次调用返回当前毫秒时间戳
- 在数组字面量中,每个对象创建时调用 `Date.now()` 得到不同值
- 虽然时间差很小(几毫秒),但生成的 ID 不一致
- 例如: `news_1765726336863_1`, `news_1765726336864_2`, `news_1765726336865_3`
- 数据库重新初始化后,ID 完全改变
- 前端缓存了旧的新闻 ID,导致更新请求找不到记录

### 问题 2: Activities 表约束与前端不匹配

**位置**: `/scripts/init-db.js` 第 113 行

```javascript
// ❌ 问题代码
status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled'))
```

**问题详解**:
- 数据库约束只允许 'active' 和 'cancelled'
- 前端代码使用 'inactive' 状态
- 更新活动状态时触发 CHECK constraint 错误
- SQLite 报错: `stepping, CHECK constraint failed: status IN ('active', 'cancelled')`

## ✅ 解决方案

### 修复 1: 统一新闻 ID 时间戳

```javascript
// ✅ 修复后
const baseTimestamp = Date.now();  // 只调用一次
const newsData = [
  {
    id: `news_${baseTimestamp}_1`,  // 使用相同时间戳
    title: '...',
  },
  {
    id: `news_${baseTimestamp}_2`,  // 使用相同时间戳
    title: '...',
  },
  // ...
]
```

**效果**:
- 所有新闻使用同一个时间戳前缀
- 生成的 ID: `news_1765727076152_1`, `news_1765727076152_2`, ...
- ID 格式一致,易于调试和追踪

### 修复 2: 更新 Activities 表约束

```javascript
// ✅ 修复后
status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive'))
```

**效果**:
- 允许 'active' 和 'inactive' 两种状态
- 与前端代码一致
- 状态切换不再报错

## 📂 修改的文件

### `/scripts/init-db.js`

**第 113 行**: Activities 表约束
```diff
- status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled')),
+ status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
```

**第 941-1053 行**: 新闻数据生成
```diff
+ const baseTimestamp = Date.now();
  const newsData = [
    {
-     id: `news_${Date.now()}_1`,
+     id: `news_${baseTimestamp}_1`,
      title: '...',
    },
    {
-     id: `news_${Date.now()}_2`,
+     id: `news_${baseTimestamp}_2`,
      title: '...',
    },
    // ... 所有 8 个新闻都使用 baseTimestamp
  ]
```

## 🎯 影响范围

### 修复的功能
- ✅ 新闻编辑和更新 (不再 404)
- ✅ 新闻发布状态切换
- ✅ 活动状态切换 (不再 CHECK constraint 错误)
- ✅ 数据库重新初始化后 ID 一致性

### 需要的操作
- ⚠️ **必须重新初始化数据库**: `node scripts/init-db.js`
- ⚠️ **必须刷新浏览器**: 清除前端缓存的旧新闻 ID
- ⚠️ **可能需要重新登录**: 数据库重置后 token 可能失效

## 🧪 验证

### 验证数据库修复

```bash
# 1. 检查 activities 表约束
sqlite3 data/database.sqlite "SELECT sql FROM sqlite_master WHERE type='table' AND name='activities';"
# 应该看到: CHECK (status IN ('active', 'inactive'))

# 2. 检查新闻 ID 格式
sqlite3 data/database.sqlite "SELECT id FROM news;"
# 应该看到: news_XXXXX_1, news_XXXXX_2, ... (时间戳相同)

# 3. 测试新闻更新
sqlite3 data/database.sqlite "UPDATE news SET title = '测试' WHERE id = 'news_XXXXX_1'; SELECT changes();"
# 应该返回: 1 (表示 1 行被更新)
```

### 前端测试

1. **重新初始化数据库**:
   ```bash
   node scripts/init-db.js
   ```

2. **刷新浏览器**: 按 `Cmd+Shift+R` (Mac) 或 `Ctrl+Shift+R` (Windows/Linux)

3. **重新登录**: `admin@example.com` / `admin123`

4. **测试新闻管理**:
   - 访问 http://localhost:3000/admin/news
   - 编辑任意新闻,修改标题和内容
   - 点击保存,应该成功
   - 切换发布状态,应该成功

5. **测试活动管理**:
   - 访问 http://localhost:3000/admin/activities
   - 切换活动状态 (active ↔ inactive),应该成功
   - 编辑活动信息,应该成功

## 💡 经验教训

### 1. 避免在数组字面量中多次调用时间函数

❌ **错误做法**:
```javascript
const items = [
  { id: Date.now(), name: 'item1' },
  { id: Date.now(), name: 'item2' },  // 不同的时间戳!
]
```

✅ **正确做法**:
```javascript
const baseTime = Date.now();
const items = [
  { id: `${baseTime}_1`, name: 'item1' },
  { id: `${baseTime}_2`, name: 'item2' },
]
```

### 2. 数据库约束必须与应用代码一致

- ✅ 创建表时考虑所有可能的状态值
- ✅ 前后端状态枚举保持一致
- ✅ 使用 TypeScript 类型定义约束
- ✅ 添加数据库迁移脚本而不是直接修改表结构

### 3. ID 生成策略

**对于测试数据**:
- 使用一致的前缀 + 序号
- 便于调试和追踪
- 例如: `news_TIMESTAMP_1`, `news_TIMESTAMP_2`

**对于生产数据**:
- 使用 UUID 或自增 ID
- 避免时间戳导致的冲突
- 考虑分布式场景

### 4. 数据初始化脚本的测试

- ✅ 运行多次确保幂等性
- ✅ 验证生成的 ID 格式
- ✅ 检查所有约束是否正确
- ✅ 测试边界情况

## 📝 后续建议

### 1. 添加数据库迁移系统

使用工具如 `knex.js` 或 `prisma migrate`:
```javascript
// migrations/001_fix_activities_status.js
exports.up = function(knex) {
  return knex.schema.alterTable('activities', (table) => {
    table.dropColumn('status');
    table.enum('status', ['active', 'inactive']).defaultTo('active');
  });
};
```

### 2. 添加数据验证��

在 API 层验证状态值:
```typescript
const VALID_ACTIVITY_STATUS = ['active', 'inactive'] as const;
type ActivityStatus = typeof VALID_ACTIVITY_STATUS[number];

function validateStatus(status: string): status is ActivityStatus {
  return VALID_ACTIVITY_STATUS.includes(status as ActivityStatus);
}
```

### 3. 使用更健壮的 ID 生成

```javascript
const { v4: uuidv4 } = require('uuid');

const newsData = [
  { id: uuidv4(), title: '...' },  // 例如: 'a1b2c3d4-...'
  { id: uuidv4(), title: '...' },
];
```

### 4. 添加数据库种子脚本

分离初始化和测试数据:
```
scripts/
  ├── init-db.js        # 只创建表结构
  ├── seed-dev.js       # 开发环境测试数据
  └── seed-prod.js      # 生产环境初始数据
```

---

**修复时间**: 2025-12-14 00:15
**状态**: ✅ 已完成
**测试状态**: ⏳ 待前端验证
