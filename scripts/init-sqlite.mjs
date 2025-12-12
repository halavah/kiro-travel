#!/usr/bin/env node

/**
 * SQLite 数据库初始化脚本
 * 使用 better-sqlite3 (同步 API)
 */

import Database from 'better-sqlite3'
import { readFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const dataDir = join(process.cwd(), 'data')
const dbPath = join(dataDir, 'travel.db')

console.log('🚀 开始初始化 SQLite 数据库...')
console.log(`📍 数据库路径: ${dbPath}\n`)

// 确保数据目录存在
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true })
  console.log('✅ 创建数据目录')
}

// 创建数据库连接
const db = new Database(dbPath)

// 配置数据库
db.pragma('journal_mode = WAL') // 启用 WAL 模式
db.pragma('foreign_keys = ON')  // 启用外键约束

console.log('✅ 数据库连接成功\n')

// 读取并执行 SQL 文件
function executeSqlFile(filename, description) {
  console.log(`📝 ${description}...`)

  try {
    const sqlPath = join(__dirname, filename)
    const sql = readFileSync(sqlPath, 'utf8')

    // 执行 SQL (better-sqlite3 是同步的)
    db.exec(sql)

    console.log(`✅ ${description} 完成\n`)
  } catch (error) {
    console.error(`❌ ${description} 失败:`, error.message)
    throw error
  }
}

try {
  // 1. 创建表结构
  executeSqlFile('sqlite_schema.sql', '创建数据表和索引')

  // 2. 插入测试数据
  executeSqlFile('sqlite_seed_data.sql', '插入测试数据')

  // 3. 设置全文搜索 (FTS5)
  executeSqlFile('003_add_fts_search.sql', '配置全文搜索索引')

  // 4. 验证数据
  console.log('📊 验证数据插入情况:')

  const tables = [
    { name: 'profiles', label: '用户' },
    { name: 'spot_categories', label: '景点分类' },
    { name: 'spots', label: '景点' },
    { name: 'tickets', label: '门票' },
    { name: 'hotels', label: '酒店' },
    { name: 'hotel_rooms', label: '酒店房间' },
    { name: 'activities', label: '活动' },
    { name: 'news_categories', label: '新闻分类' },
    { name: 'news', label: '新闻' },
    { name: 'spot_comments', label: '评论' }
  ]

  for (const table of tables) {
    const result = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get()
    console.log(`  ✓ ${table.label}: ${result.count} 条`)
  }

  console.log('\n🎉 数据库初始化完成！')
  console.log('\n测试账号信息:')
  console.log('  管理员账号:')
  console.log('    邮箱: admin@kiro.com')
  console.log('    密码: password123')
  console.log('  普通用户:')
  console.log('    邮箱: zhang@test.com')
  console.log('    密码: password123')
  console.log('\n下一步:')
  console.log('  1. 运行 npm run dev 启动开发服务器')
  console.log('  2. 访问 http://localhost:3000')
  console.log('  3. 使用测试账号登录系统\n')

} catch (error) {
  console.error('\n❌ 初始化失败:', error.message)
  console.error('\n建议:')
  console.error('  1. 检查 scripts/ 目录下的 SQL 文件是否存在')
  console.error('  2. 确保有写入权限')
  console.error('  3. 查看详细错误信息\n')
  process.exit(1)
} finally {
  db.close()
  console.log('🔌 数据库连接已关闭')
}