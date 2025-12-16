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

// 检查数据库是否已初始化（检查所有关键表）
function isDatabaseInitialized(): boolean {
  try {
    // 检查所有关键表是否存在
    const requiredTables = [
      'profiles', 'spot_categories', 'spots', 'tickets', 'activities',
      'hotels', 'hotel_rooms', 'orders', 'news', 'news_categories'
    ]

    for (const tableName of requiredTables) {
      const result = db.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=?"
      ).get(tableName)

      if (!result) {
        console.log(`⚠️  缺少表: ${tableName}`)
        return false
      }
    }

    console.log('✅ 数据库已初始化，所有表都存在')
    return true
  } catch (error) {
    console.error('❌ 检查数据库初始化状态失败:', error)
    return false
  }
}

// 数据库初始化函数
export function initDatabase() {
  try {
    // 使用 init-db.js 脚本初始化数据库
    const { execSync } = require('child_process')
    const initScriptPath = join(process.cwd(), 'scripts', 'init-db.js')

    // 检查初始化脚本是否存在
    if (!existsSync(initScriptPath)) {
      throw new Error(`初始化脚本不存在: ${initScriptPath}`)
    }

    console.log('🔧 执行数据库初始化脚本:', initScriptPath)
    execSync(`node "${initScriptPath}"`, {
      stdio: 'inherit',
      cwd: process.cwd(),
      env: { ...process.env, DB_INITIALIZING: 'true' }
    })
    console.log('✅ 数据库初始化成功')
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error)
    throw error
  }
}

// 自动初始化数据库（如果表不存在）
// 使用环境变量防止在 init-db.js 执行时重复初始化
// 在构建阶段和生产环境跳过自动初始化
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build'
const isProduction = process.env.NODE_ENV === 'production'

if (!isDatabaseInitialized() && !process.env.DB_INITIALIZING && !isBuildTime) {
  if (isProduction) {
    // 生产环境：只记录警告，不自动初始化
    console.warn('⚠️  生产环境数据库未初始化，请手动运行: npm run db:init')
    console.warn('⚠️  或访问 /api/init-db 端点进行初始化')
  } else {
    // 开发环境：自动初始化
    console.log('🔧 数据库未初始化，开始自动初始化...')
    try {
      // 设置标志防止递归初始化
      process.env.DB_INITIALIZING = 'true'
      initDatabase()
      delete process.env.DB_INITIALIZING
    } catch (error) {
      console.error('❌ 自动初始化数据库失败:', error)
      delete process.env.DB_INITIALIZING
      // 不抛出错误，允许构建继续
    }
  }
} else if (isBuildTime) {
  console.log('⏭️  构建阶段，跳过数据库初始化')
}

// 关闭数据库连接
export function closeDatabase() {
  db.close()
  console.log('✅ 数据库连接已关闭')
}

// 导出数据库实例供其他模块使用
export default db