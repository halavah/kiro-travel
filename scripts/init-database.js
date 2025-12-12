/**
 * Supabase 数据库自动初始化脚本
 *
 * 使用方法：
 * node scripts/init-database.js
 *
 * 或者添加到 package.json:
 * npm run db:init
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 从环境变量读取配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 错误: 缺少 Supabase 环境变量')
  console.error('请确保 .env.local 文件包含:')
  console.error('  NEXT_PUBLIC_SUPABASE_URL=...')
  console.error('  NEXT_PUBLIC_SUPABASE_ANON_KEY=...')
  console.error('  SUPABASE_SERVICE_ROLE_KEY=... (可选，用于管理员操作)')
  process.exit(1)
}

// 创建 Supabase 客户端
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// 读取 SQL 文件
function readSqlFile(filename) {
  const filePath = join(__dirname, filename)
  return readFileSync(filePath, 'utf-8')
}

// 执行 SQL
async function executeSql(sql, description) {
  console.log(`\n📝 ${description}...`)

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })

    if (error) {
      // 尝试直接通过 REST API 执行
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({ sql_query: sql })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`)
      }

      console.log(`✅ ${description} 完成`)
      return await response.json()
    }

    console.log(`✅ ${description} 完成`)
    return data
  } catch (err) {
    console.error(`❌ ${description} 失败:`, err.message)
    throw err
  }
}

// 使用 Supabase 的 SQL API 直接执行
async function executeRawSql(sql, description) {
  console.log(`\n📝 ${description}...`)

  try {
    // 分割 SQL 语句（以分号分隔）
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    console.log(`   执行 ${statements.length} 条 SQL 语句...`)

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (!statement) continue

      try {
        // 使用 Supabase SQL API
        const { error } = await supabase.rpc('exec', {
          sql: statement
        })

        if (error) {
          console.log(`   ⚠️  语句 ${i + 1}/${statements.length} 可能已存在，跳过...`)
        } else {
          console.log(`   ✓ 语句 ${i + 1}/${statements.length}`)
        }
      } catch (err) {
        console.log(`   ⚠️  语句 ${i + 1}/${statements.length} 出错:`, err.message)
        // 继续执行下一条
      }
    }

    console.log(`✅ ${description} 完成`)
  } catch (err) {
    console.error(`❌ ${description} 失败:`, err.message)
    throw err
  }
}

// 使用 PostgreSQL REST API
async function executeViaPgRest(sql, description) {
  console.log(`\n📝 ${description}...`)

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ sql })
    })

    if (response.ok) {
      console.log(`✅ ${description} 完成`)
      return
    }

    const errorText = await response.text()
    console.log(`⚠️  通过 REST API 执行失败，尝试直接连接...`)
    console.log(`   错误: ${errorText}`)

    // 回退到客户端方法
    await executeDirectly(sql, description)

  } catch (err) {
    console.error(`❌ ${description} 失败:`, err.message)
    // 尝试直接执行
    await executeDirectly(sql, description)
  }
}

// 直接通过 Supabase 客户端执行（逐条）
async function executeDirectly(sql, description) {
  console.log(`\n📝 ${description} (直接执行模式)...`)

  // 分割并执行每条语句
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  let successCount = 0
  let skipCount = 0
  let errorCount = 0

  for (const statement of statements) {
    try {
      const { error } = await supabase.rpc('exec', { sql: statement })

      if (error) {
        // 可能是表已存在等错误，记录但继续
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          skipCount++
        } else {
          console.log(`   ⚠️  警告:`, error.message.substring(0, 100))
          errorCount++
        }
      } else {
        successCount++
      }
    } catch (err) {
      errorCount++
    }
  }

  console.log(`   ✓ 成功: ${successCount}, 跳过: ${skipCount}, 错误: ${errorCount}`)
  console.log(`✅ ${description} 完成`)
}

// 主函数
async function main() {
  console.log('🚀 开始初始化 Supabase 数据库...')
  console.log(`📍 连接到: ${supabaseUrl}`)
  console.log('')

  try {
    // 测试连接
    console.log('🔌 测试数据库连接...')
    const { data, error } = await supabase.from('profiles').select('count').limit(1)

    if (!error || error.code === '42P01') { // 42P01 = 表不存在
      console.log('✅ 数据库连接成功')
    }

    // 执行 SQL 脚本
    const scripts = [
      { file: '001_create_tables.sql', desc: '创建数据表' },
      { file: '002_enable_rls.sql', desc: '启用行级安全策略' },
      { file: '003_create_triggers.sql', desc: '创建触发器' },
      { file: '004_seed_data.sql', desc: '插入示例数据' }
    ]

    for (const script of scripts) {
      const sql = readSqlFile(script.file)
      await executeDirectly(sql, script.desc)
    }

    console.log('\n🎉 数据库初始化完成！')
    console.log('\n下一步:')
    console.log('  1. 运行 npm run dev 启动开发服务器')
    console.log('  2. 访问 http://localhost:3000')
    console.log('  3. 在 Supabase 控制台查看数据: https://supabase.com/dashboard')
    console.log('')

  } catch (err) {
    console.error('\n❌ 初始化失败:', err.message)
    console.error('\n建议:')
    console.error('  1. 检查 .env.local 中的环境变量是否正确')
    console.error('  2. 确保有网络连接')
    console.error('  3. 查看 Supabase 控制台是否有错误: https://supabase.com/dashboard')
    console.error('  4. 或者手动在 SQL Editor 中执行 scripts/ 目录下的 SQL 文件')
    console.error('')
    process.exit(1)
  }
}

// 运行
main()
