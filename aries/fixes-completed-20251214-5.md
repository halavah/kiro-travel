# Bug 修复报告 - 新闻更新失败 (2025-12-14)

## 🐛 问题

**错误信息**:
```
Error updating news: Error: Failed to update news
PUT http://localhost:3000/api/news/[id] [HTTP/1.1 500 Internal Server Error]
```

## 🔍 根本原因

**变量名冲突** - `/app/api/news/[id]/route.ts` ��� 81 行

```typescript
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }  // 参数名为 params
) {
  // ...
  const params: any[] = [...]  // ❌ 变量名冲突！
  // ...
  params.push(id)  // 这里会出问题
}
```

### 问题详解

1. **函数参数**: `{ params }` 是解构的路由参数，类型为 `{ id: string }`
2. **局部变量**: `const params: any[]` 是 SQL 参数数组
3. **变量遮蔽**: 局部变量 `params` 遮蔽了函数参数 `params`
4. **运行时错误**: 当尝试 `params.push(id)` 时，TypeScript/JavaScript 不知道应该使用哪个 `params`

## ✅ 解决方案

重命名局部变量，避免冲突：

```typescript
// 修改前
const params: any[] = [title, content, summary, cover_image, category_id, is_published ? 1 : 0]
if (publishedAt) {
  params.push(publishedAt)
}
params.push(id)
dbRun(sql, params)

// 修改后
const sqlParams: any[] = [title, content, summary, cover_image, category_id, is_published ? 1 : 0]
if (publishedAt) {
  sqlParams.push(publishedAt)
}
sqlParams.push(id)
dbRun(sql, sqlParams)
```

## 📂 修改的文件

- `/app/api/news/[id]/route.ts` - PUT 方法，第 81-91 行

## 🎯 影响范围

### 修复的功能
- ✅ 新闻编辑和保存
- ✅ 新闻发布状态切换
- ✅ 新闻批量操作

## 💡 相关问题

这个问题与之前修复的 activities 表约束问题不同：
- Activities: 数据库约束错误（CHECK constraint）
- News: 代码逻辑错误（变量名冲突）

## 📝 教训

1. **避免变量名遮蔽**: 局部变量不应与函数参数同名
2. **使用明确的命名**: `sqlParams` 比 `params` 更清晰
3. **TypeScript 的限制**: TypeScript 不会警告变量遮蔽问题
4. **ESLint 规则**: 建议启用 `no-shadow` 规则

## 🔧 建议的 ESLint 配置

```json
{
  "rules": {
    "no-shadow": "error",
    "@typescript-eslint/no-shadow": "error"
  }
}
```

---

**修复时间**: 2025-12-14 23:58
**状态**: ✅ 已完成
