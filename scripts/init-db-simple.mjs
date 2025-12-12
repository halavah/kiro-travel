/**
 * Supabase 数据库自动初始化脚本 (简化版)
 *
 * 使用 Supabase SQL API 直接执行 SQL 脚本
 *
 * 使用方法：
 * node scripts/init-db-simple.mjs
 */

import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 从环境变量读取配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 错误: 缺少 Supabase 环境变量')
  console.error('\n请在 .env.local 文件中设置:')
  console.error('  NEXT_PUBLIC_SUPABASE_URL=your-url')
  console.error('  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key')
  process.exit(1)
}

// 读取 SQL 文件
function readSqlFile(filename) {
  const filePath = join(__dirname, filename)
  return readFileSync(filePath, 'utf-8')
}

// 通过 Supabase 的 PostgREST 执行 SQL
async function executeSqlQuery(sql) {
  const url = `${supabaseUrl}/rest/v1/rpc/exec`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify({ query: sql })
  })

  return { ok: response.ok, status: response.status, text: await response.text() }
}

// 使用 SQL Editor API (需要 Service Role Key)
async function executeSqlDirect(sqlStatements, description) {
  console.log(`\n📝 ${description}...`)

  const statements = sqlStatements
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  console.log(`   共 ${statements.length} 条 SQL 语句`)

  let success = 0
  let skipped = 0
  let failed = 0

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i]

    try {
      // 构造完整的 SQL 语句
      const fullSql = statement.endsWith(';') ? statement : `${statement};`

      // 直接调用 Supabase REST API
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ sql: fullSql })
      })

      if (response.ok) {
        success++
        process.stdout.write('.')
      } else {
        const errorText = await response.text()
        if (errorText.includes('already exists') || errorText.includes('duplicate')) {
          skipped++
          process.stdout.write('s')
        } else {
          failed++
          process.stdout.write('x')
        }
      }
    } catch (err) {
      failed++
      process.stdout.write('x')
    }

    // 每 20 条换行
    if ((i + 1) % 20 === 0) {
      console.log(` ${i + 1}/${statements.length}`)
    }
  }

  console.log(`\n   ✓ 成功: ${success} | 跳过: ${skipped} | 失败: ${failed}`)
  console.log(`✅ ${description} 完成\n`)
}

// 主函数
async function main() {
  console.log('🚀 开始初始化 Supabase 数据库...')
  console.log(`📍 URL: ${supabaseUrl}`)
  console.log('')

  console.log('⚠️  注意: 由于权限限制，某些操作可能需要手动执行')
  console.log('如果自动执行失败，请按照以下步骤手动操作:\n')
  console.log('1. 访问 Supabase 控制台: https://supabase.com/dashboard')
  console.log('2. 选择你的项目')
  console.log('3. 点击左侧 "SQL Editor"')
  console.log('4. 依次复制粘贴并执行以下文件:\n')
  console.log('   - scripts/001_create_tables.sql')
  console.log('   - scripts/002_enable_rls.sql')
  console.log('   - scripts/003_create_triggers.sql')
  console.log('   - scripts/004_seed_data.sql')
  console.log('\n按 Ctrl+C 取消，或按 Enter 继续尝试自动执行...')

  // 等待用户确认
  await new Promise(resolve => {
    process.stdin.once('data', resolve)
  })

  try {
    const scripts = [
      { file: '001_create_tables.sql', desc: '步骤 1/4: 创建数据表' },
      { file: '002_enable_rls.sql', desc: '步骤 2/4: 启用行级安全策略' },
      { file: '003_create_triggers.sql', desc: '步骤 3/4: 创建触发器和函数' },
      { file: '004_seed_data.sql', desc: '步骤 4/4: 插入示例数据' }
    ]

    for (const script of scripts) {
      const sql = readSqlFile(script.file)
      await executeSqlDirect(sql, script.desc)
    }

    console.log('🎉 数据库初始化尝试完成！')
    console.log('\n📋 验证步骤:')
    console.log('1. 访问 Supabase 控制台: https://supabase.com/dashboard')
    console.log('2. 选择 "Table Editor" 查看是否有以下表:')
    console.log('   - profiles, spots, tickets, orders, hotels, etc.')
    console.log('3. 如果表不存在，请手动在 SQL Editor 中执行 SQL 文件')
    console.log('')
    console.log('✅ 下一步: 运行 npm run dev 启动开发服务器')
    console.log('')

  } catch (err) {
    console.error('\n❌ 自动初始化失败:', err.message)
    console.error('\n请手动执行 SQL 文件（详见 SUPABASE_SETUP.md）')
    process.exit(1)
  }
}

// 运行
main().catch(err => {
  console.error('致命错误:', err)
  process.exit(1)
})
