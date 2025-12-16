import { db } from './db'

// 通用查询函数
export function dbQuery<T = any>(sql: string, params: any[] = []): T[] {
  try {
    const stmt = db.prepare(sql)
    return stmt.all(...params) as T[]
  } catch (error) {
    console.error('查询错误:', error)
    throw error
  }
}

// 查询单行
export function dbGet<T = any>(sql: string, params: any[] = []): T | undefined {
  try {
    const stmt = db.prepare(sql)
    return stmt.get(...params) as T | undefined
  } catch (error) {
    console.error('查询错误:', error)
    throw error
  }
}

// 执行插入/更新/删除
export function dbRun(sql: string, params: any[] = []): { lastInsertRowid: number; changes: number } {
  try {
    const stmt = db.prepare(sql)
    const result = stmt.run(...params)
    return {
      lastInsertRowid: result.lastInsertRowid as number,
      changes: result.changes
    }
  } catch (error) {
    console.error('执行错误:', error)
    throw error
  }
}

// 分页查询辅助函数
export function paginate<T = any>(
  sql: string,
  page: number = 1,
  limit: number = 10,
  params: any[] = []
): {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
} {
  // 获取总数 - 移除 ORDER BY 和 LIMIT 子句以提高性能
  const sqlWithoutOrder = sql.replace(/ORDER BY[^)]*$/i, '').trim()
  const countSql = `SELECT COUNT(*) as total FROM (${sqlWithoutOrder})`
  const { total } = dbGet<{ total: number }>(countSql, params) || { total: 0 }

  // 获取分页数据
  const offset = (page - 1) * limit
  const paginatedSql = `${sql} LIMIT ? OFFSET ?`
  const data = dbQuery<T>(paginatedSql, [...params, limit, offset])

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  }
}

// 事务执行
export function dbTransaction<T>(callback: () => T): T {
  const transaction = db.transaction(callback)
  return transaction()
}

// JSON 字段规范化工具函数
/**
 * 规范化 images 字段，确保返回字符串数组
 * 处理以下情况：
 * - 已经是数组：直接返回
 * - JSON 字符串：解析后返回
 * - 普通字符串：包装成单元素数组
 * - null/undefined/空字符串：返回空数组
 */
export function normalizeImages(value: unknown): string[] {
  // 处理 null/undefined
  if (value === null || value === undefined) {
    return []
  }

  // 如果已经是数组，直接返回
  if (Array.isArray(value)) {
    return value.filter(item => typeof item === 'string')
  }

  // 如果是字符串，尝试解析
  if (typeof value === 'string') {
    // 空字符串
    if (value.trim() === '') {
      return []
    }

    // 尝试作为 JSON 解析
    if (value.startsWith('[') || value.startsWith('"[')) {
      try {
        const parsed = JSON.parse(value)
        if (Array.isArray(parsed)) {
          return parsed.filter(item => typeof item === 'string')
        }
        // 如果解析结果不是数组，尝试再解析一次（处理双重序列化）
        if (typeof parsed === 'string') {
          try {
            const doubleParsed = JSON.parse(parsed)
            if (Array.isArray(doubleParsed)) {
              return doubleParsed.filter(item => typeof item === 'string')
            }
          } catch {
            // 第二次解析失败，返回原字符串
            return [parsed]
          }
        }
        return []
      } catch (error) {
        // JSON 解析失败，作为普通字符串处理
        console.warn('Failed to parse images as JSON:', value)
        return [value]
      }
    }

    // 普通字符串（URL），包装成数组
    return [value]
  }

  // 其他类型，返回空数组
  console.warn('Unexpected images type:', typeof value, value)
  return []
}

/**
 * 规范化 JSON 数组字段为数据库存储格式
 * 先规范化为数组，再序列化为 JSON 字符串
 */
export function normalizeJsonArrayField(value: unknown): string {
  const normalized = normalizeImages(value)
  return JSON.stringify(normalized)
}