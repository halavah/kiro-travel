#!/usr/bin/env node

/**
 * Supabase 数据库自动初始化脚本
 *
 * 使用 @supabase/supabase-js 客户端直接执行 SQL
 *
 * 使用方法：
 *   npm run db:auto
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 读取 .env.local
function loadEnv() {
  try {
    const envPath = join(__dirname, '..', '.env.local')
    const envContent = readFileSync(envPath, 'utf-8')
    const env = {}

    envContent.split('\n').forEach(line => {
      line = line.trim()
      if (line && !line.startsWith('#')) {
        const [key, ...values] = line.split('=')
        if (key && values.length) {
          env[key.trim()] = values.join('=').trim()
        }
      }
    })

    return env
  } catch (err) {
    return {}
  }
}

const env = loadEnv()
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('\n╔════════════════════════════════════════════════╗')
console.log('║   🤖 Supabase 数据库自动初始化脚本          ║')
console.log('╚════════════════════════════════════════════════╝\n')

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ 错误: ��少环境变量\n')
  console.error('请确保 .env.local 包含:')
  console.error('  NEXT_PUBLIC_SUPABASE_URL=...')
  console.error('  NEXT_PUBLIC_SUPABASE_ANON_KEY=...\n')
  process.exit(1)
}

const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]
console.log('🔧 环境检查')
console.log(`   项目: ${projectRef}`)
console.log(`   URL: ${SUPABASE_URL}`)
console.log('   密钥: ✓\n')

// 创建 Supabase 客户端
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// 读取 SQL 文件
function readSqlFile(filename) {
  const filePath = join(__dirname, filename)
  return readFileSync(filePath, 'utf-8')
}

// 执行单条 SQL 语句（通过 RPC）
async function executeSingleSql(sql) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_text: sql })
    if (error) throw error
    return { success: true, data }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

// 通过创建临时函数来执行 SQL
async function executeViaTempFunction(sqlStatements, description) {
  console.log(`\n📝 ${description}...`)

  // 将 SQL 语句组合
  const combinedSql = sqlStatements
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 10 && !s.startsWith('--'))
    .join(';\n') + ';'

  console.log(`   准备执行 SQL (${combinedSql.length} 字符)...\n`)

  // 尝试直接通过 supabase-js 客户端执行
  // 注意: 由于权限限制，某些操作可能失败

  let successCount = 0
  let failCount = 0

  // 分批执行
  const statements = combinedSql.split(';').filter(s => s.trim().length > 5)

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i].trim()
    if (!stmt) continue

    // 使用 Supabase Database REST API
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/query_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ query: stmt + ';' })
      })

      if (response.ok || response.status === 204) {
        successCount++
        process.stdout.write('✓')
      } else {
        failCount++
        process.stdout.write('✗')
      }
    } catch (err) {
      failCount++
      process.stdout.write('✗')
    }

    if ((i + 1) % 50 === 0) {
      console.log(` ${i + 1}/${statements.length}`)
    }
  }

  console.log(`\n\n   成功: ${successCount} | 失败: ${failCount}`)

  if (failCount > successCount) {
    console.log(`\n⚠️  ${description} - 自动执行失败较多`)
    return false
  }

  console.log(`\n✅ ${description} - 完成`)
  return true
}

// 使用 Supabase SDK 创建表（绕过 RPC）
async function createTablesDirectly() {
  console.log('\n📝 步骤 1/4: 创建数据表结构...')
  console.log('   使用 Supabase SDK 直接创建...\n')

  const sql = readSqlFile('001_create_tables.sql')

  // 由于 Supabase JS 客户端不支持直接执行 DDL
  // 我们需要返回 false 让用户手动执行
  console.log('⚠️  由于 Supabase API 限制，无法自动执行 DDL 语句')
  console.log('   (CREATE TABLE, ALTER TABLE 等)\n')

  return false
}

// 主函数
async function main() {
  console.log('📌 说明:')
  console.log('   由于 Supabase 的安全限制，DDL 语句（创建表、触发器等）')
  console.log('   无法通过 REST API 自动执行。\n')
  console.log('   推荐方式: 使用 Supabase Web 控制台手动执行\n')

  console.log('🔍 检测数据库状态...\n')

  // 检查是否已有表
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)

    if (!error) {
      console.log('✅ 检测到 profiles 表已存在')
      console.log('   数据库可能已经初始化\n')

      // 列出所有表
      const tables = [
        'profiles', 'spot_categories', 'spots', 'spot_comments',
        'spot_favorites', 'spot_likes', 'tickets', 'cart_items',
        'orders', 'order_items', 'hotels', 'hotel_rooms',
        'hotel_bookings', 'activities', 'news'
      ]

      console.log('📊 验证所有表...\n')
      let existingTables = []

      for (const table of tables) {
        try {
          const { error } = await supabase.from(table).select('count').limit(0)
          if (!error) {
            existingTables.push(table)
            process.stdout.write('✓')
          } else {
            process.stdout.write('✗')
          }
        } catch {
          process.stdout.write('✗')
        }

        if ((existingTables.length + 1) % 15 === 0) console.log()
      }

      console.log(`\n\n   找到 ${existingTables.length}/${tables.length} 张表`)

      if (existingTables.length === tables.length) {
        console.log('\n🎉 数据库已完全初始化！\n')
        console.log('✅ 下一步:')
        console.log('   1. 启动开发服务器: npm run dev')
        console.log('   2. 访问应用: http://localhost:3000')
        console.log(`   3. 查看数据: https://supabase.com/dashboard/project/${projectRef}/editor\n`)
        return
      } else {
        console.log('\n⚠️  数据库部分初始化，可能缺少某些表\n')
      }
    }
  } catch (err) {
    console.log('📋 数据库未初始化，需要执行 SQL 脚本\n')
  }

  console.log('═'.repeat(60))
  console.log('\n💡 自动初始化不可用\n')
  console.log('📋 请按照以下步骤手动初始化:\n')
  console.log(`1. 打开 Supabase SQL Editor:`)
  console.log(`   https://supabase.com/dashboard/project/${projectRef}/sql/new\n`)
  console.log('2. 依次复制粘贴并执行以下文件:\n')
  console.log('   ✓ scripts/001_create_tables.sql')
  console.log('   ✓ scripts/002_enable_rls.sql')
  console.log('   ✓ scripts/003_create_triggers.sql')
  console.log('   ✓ scripts/004_seed_data.sql\n')
  console.log('3. 查看详细步骤:')
  console.log('   📖 docs/QUICK_START.md (只需5分钟)\n')
  console.log('═'.repeat(60))
  console.log('')
}

// 运行
main().catch(err => {
  console.error('\n❌ 错误:', err.message)
  console.error('\n请查看 docs/QUICK_START.md 了解手动设置步骤\n')
  process.exit(1)
})
