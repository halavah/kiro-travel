import Database from 'better-sqlite3'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'

// 数据库路径配置
// 优先使用环境变量 DATABASE_PATH（Render 部署时使用）
// 如果没有设置，则使用本地 ./data 目录
const getDbPath = () => {
  if (process.env.DATABASE_PATH) {
    // Render 部署环境，使用持久化磁盘路径
    console.log('📁 使用 Render 持久化存储:', process.env.DATABASE_PATH)
    return process.env.DATABASE_PATH
  }
  // 本地开发环境
  const dataDir = join(process.cwd(), 'data')
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true })
  }
  const localPath = join(dataDir, 'database.sqlite')
  console.log('📁 使用本地数据库:', localPath)
  return localPath
}

// 确保数据目录存在（对于 Render 的持久化磁盘）
const dbPath = getDbPath()
const dbDir = dbPath.substring(0, dbPath.lastIndexOf('/'))
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true })
  console.log('✅ 创建数据库目录:', dbDir)
}

// 创建数据库连接
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

// 检查数据库是否已初始化
function isDatabaseInitialized(): boolean {
  try {
    const result = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='profiles'").get()
    return !!result
  } catch (error) {
    return false
  }
}

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

// 自动初始化数据库（如果表不存在）
if (!isDatabaseInitialized()) {
  console.log('🔧 数据库未初始化，开始自动初始化...')
  try {
    initDatabase()
  } catch (error) {
    console.error('❌ 自动初始化数据库失败:', error)
    // 不抛出错误，允许构建继续（运行时会由 dynamic 路由处理）
  }
}

// 关闭数据库连接
export function closeDatabase() {
  db.close()
  console.log('✅ 数据库连接已关闭')
}

// 导出数据库实例供其他模块使用
export default db