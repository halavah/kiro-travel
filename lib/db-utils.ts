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
  // 获取总数
  const countSql = `SELECT COUNT(*) as total FROM (${sql})`
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