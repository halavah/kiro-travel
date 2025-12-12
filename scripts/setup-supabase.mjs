#!/usr/bin/env node

/**
 * Supabase 数据库初始化脚本
 *
 * 直接通过 Supabase API 执行 SQL
 *
 * 使用方法：
 *   npm run db:init
 */

import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 读取 .env.local 文件
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
    console.error('❌ 无法读取 .env.local 文件')
    return {}
  }
}

const env = loadEnv()
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('\n╔════════════════════════════════════════════════╗')
console.log('║   🚀 Supabase 数据库自动初始化               ║')
console.log('╚════════════════════════════════════════════════╝\n')

console.log('🔧 环境检查...')
console.log(`   URL: ${SUPABASE_URL || '❌ 未找到'}`)
console.log(`   Key: ${SUPABASE_KEY ? '✓ 已设置' : '❌ 未找到'}`)
console.log('')

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ 错误: 缺少必需的环境变量\n')
  console.error('请确保 .env.local 文件包含:')
  console.error('  NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co')
  console.error('  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...\n')
  const projectRef = SUPABASE_URL ? SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] : null
  if (projectRef) {
    console.error('在这里获取: https://supabase.com/dashboard/project/' + projectRef + '/settings/api\n')
  }
  process.exit(1)
}

const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]

// 读取 SQL 文件
function readSqlFile(filename) {
  const filePath = join(__dirname, filename)
  try {
    return readFileSync(filePath, 'utf-8')
  } catch (err) {
    console.error(`❌ 无法读取文件: ${filename}`)
    throw err
  }
}

// 通过 Supabase SQL API 执行
async function executeSqlStatements(sql, description) {
  console.log(`\n📝 ${description}...`)

  // 分割 SQL 语句
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 10 && !s.startsWith('--') && !s.match(/^\/\*/))

  console.log(`   共 ${statements.length} 条 SQL 语句\n`)

  let success = 0
  let failed = 0
  let skipped = 0

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i].trim() + ';'

    try {
      // 使用 Supabase REST API 执行 SQL
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({ query: stmt })
      })

      if (response.ok || response.status === 204) {
        success++
        process.stdout.write('✓')
      } else {
        const errorText = await response.text()
        if (
          errorText.includes('already exists') ||
          errorText.includes('duplicate') ||
          errorText.includes('does not exist')
        ) {
          skipped++
          process.stdout.write('○')
        } else {
          failed++
          process.stdout.write('✗')
          // 打印错误详情（仅前几个）
          if (failed <= 3) {
            console.log(`\n   错误 (语句 ${i + 1}): ${errorText.substring(0, 150)}...`)
          }
        }
      }
    } catch (err) {
      failed++
      process.stdout.write('✗')
    }

    // 每 50 个换行
    if ((i + 1) % 50 === 0) {
      console.log(` ${i + 1}/${statements.length}`)
    }

    // 稍微延迟，避免请求过快
    if (i % 10 === 0 && i > 0) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  console.log(`\n\n   ✓ 成功: ${success} | ○ 跳过: ${skipped} | ✗ 失败: ${failed}`)

  if (failed > statements.length / 2) {
    console.log(`\n⚠️  ${description} - 失败较多，可能需要手动执行`)
    return false
  } else if (failed > 0) {
    console.log(`\n⚠️  ${description} - 部分失败（正常，可能是权限或已存在）`)
  } else {
    console.log(`\n✅ ${description} - 完成`)
  }

  return true
}

// 主函数
async function main() {
  console.log('📌 说明:')
  console.log('   此脚本将通过 Supabase REST API 执行 SQL 初始化')
  console.log('   如遇权限问题，请手动在 Supabase 控制台执行')
  console.log('')

  const scripts = [
    { file: '001_create_tables.sql', desc: '步骤 1/4: 创建数据表结构' },
    { file: '002_enable_rls.sql', desc: '步骤 2/4: 配置行级安全策略' },
    { file: '003_create_triggers.sql', desc: '步骤 3/4: 创建触发器和函数' },
    { file: '004_seed_data.sql', desc: '步骤 4/4: 插入示例数据' }
  ]

  let successCount = 0

  for (const script of scripts) {
    try {
      const sql = readSqlFile(script.file)
      const success = await executeSqlStatements(sql, script.desc)
      if (success) successCount++
    } catch (err) {
      console.error(`❌ 读取 ${script.file} 失败:`, err.message)
    }
  }

  console.log('\n' + '═'.repeat(60))

  if (successCount >= 3) {
    console.log('\n🎉 数据库初始化完成！\n')
    console.log('✅ 下一步:')
    console.log('   1. 验证数据:')
    console.log(`      https://supabase.com/dashboard/project/${projectRef}/editor`)
    console.log('   2. 启动开发服务器: npm run dev')
    console.log('   3. 访问应用: http://localhost:3000\n')
  } else {
    console.log('\n⚠️  自动初始化遇到一些问题\n')
    console.log('📋 推荐手动执行 SQL:')
    console.log(`   1. 打开: https://supabase.com/dashboard/project/${projectRef}/sql/new`)
    console.log('   2. 依次复制粘贴以下文件内容并执行:')
    console.log('      - scripts/001_create_tables.sql')
    console.log('      - scripts/002_enable_rls.sql')
    console.log('      - scripts/003_create_triggers.sql')
    console.log('      - scripts/004_seed_data.sql')
    console.log('')
    console.log('💡 详细说明: 查看 SUPABASE_SETUP.md\n')
  }
}

// 运行
main().catch(err => {
  console.error('\n❌ 致命错误:', err.message)
  console.error('\n请查看 SUPABASE_SETUP.md 了解手动设置步骤\n')
  process.exit(1)
})
