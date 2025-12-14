import Database from 'better-sqlite3'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'

// 确保数据目录存在
const dataDir = join(process.cwd(), 'data')
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true })
}

// 创建数据库连接
const dbPath = join(dataDir, 'database.sqlite')
export const db = new Database(dbPath)

// 配置数据库
try {
  // 尝试启用 WAL 模式,如果失败则使用默认模式
  db.pragma('journal_mode = WAL')
} catch (error) {
  console.warn('⚠️  无法启用 WAL 模式,使用默认 journal 模式:', error)
  try {
    db.pragma('journal_mode = DELETE')
  } catch (e) {
    console.warn('⚠️  使用当前 journal 模式')
  }
}
db.pragma('foreign_keys = ON')  // 启用外键约束

// 数据库初始化函数
export function initDatabase() {
  try {
    // 读取 SQLite 版本的 SQL 文件并执行
    const schema = require('fs').readFileSync(join(process.cwd(), 'scripts', '001_create_tables_sqlite.sql'), 'utf8')
    db.exec(schema)
    console.log('✅ 数据库初始化成功')
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error)
    throw error
  }
}

// 关闭数据库连接
export function closeDatabase() {
  db.close()
  console.log('✅ 数据库连接已关闭')
}

// 导出数据库实例供其他模块使用
export default db