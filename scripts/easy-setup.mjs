#!/usr/bin/env node

/**
 * Supabase 数据库一键初始化工具
 *
 * 此脚本会：
 * 1. 检测数据库状态
 * 2. 自动在浏览器中打开 SQL Editor
 * 3. 提供便捷的复制命令
 *
 * 使用方法：
 *   npm run db:setup:easy
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 读取环境变量
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
  } catch {
    return {}
  }
}

const env = loadEnv()
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ 缺少环境变量，请先配置 .env.local\n')
  process.exit(1)
}

const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

console.log('\n╔═══════════════════════════════════════════════════════╗')
console.log('║     🚀 Supabase 数据库一键初始化工具               ║')
console.log('╚═══════════════════════════════════════════════════════╝\n')

// 检测数据库状态
async function checkDatabase() {
  const tables = [
    'profiles', 'spot_categories', 'spots', 'spot_comments',
    'spot_favorites', 'spot_likes', 'tickets', 'cart_items',
    'orders', 'order_items', 'hotels', 'hotel_rooms',
    'hotel_bookings', 'activities', 'news'
  ]

  console.log('🔍 检测数据库状态...\n')

  let existingTables = []

  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('count').limit(0)
      if (!error) {
        existingTables.push(table)
      }
    } catch {}
  }

  return { total: tables.length, existing: existingTables.length, tables: existingTables }
}

// 打开浏览器
async function openBrowser(url) {
  const platform = process.platform
  try {
    if (platform === 'darwin') {
      await execAsync(`open "${url}"`)
    } else if (platform === 'win32') {
      await execAsync(`start "" "${url}"`)
    } else {
      await execAsync(`xdg-open "${url}"`)
    }
    return true
  } catch {
    return false
  }
}

// 创建合并的 SQL 文件
function createCombinedSql() {
  const outputPath = join(__dirname, 'combined_setup.sql')

  const files = [
    '001_create_tables.sql',
    '002_enable_rls.sql',
    '003_create_triggers.sql',
    '004_seed_data.sql'
  ]

  let combined = `-- ╔═══════════════════════════════════════════════════════╗
-- ║   Supabase 数据库初始化脚本（合并版本）              ║
-- ║   自动生成 - 请在 Supabase SQL Editor 中执行        ║
-- ╚═══════════════════════════════════════════════════════╝

`

  files.forEach((file, index) => {
    const filePath = join(__dirname, file)
    const content = readFileSync(filePath, 'utf-8')

    combined += `\n-- ═════════════════════════════════════════════════════════\n`
    combined += `-- 步骤 ${index + 1}/4: ${file}\n`
    combined += `-- ═════════════════════════════════════════════════════════\n\n`
    combined += content
    combined += `\n\n`
  })

  writeFileSync(outputPath, combined, 'utf-8')
  return outputPath
}

// 主函数
async function main() {
  const dbStatus = await checkDatabase()

  if (dbStatus.existing === dbStatus.total) {
    console.log('✅ 数据库已完全初始化！\n')
    console.log(`   找到 ${dbStatus.existing}/${dbStatus.total} 张表\n`)
    console.log('🎉 可以开始使用了:\n')
    console.log('   npm run dev\n')
    console.log(`📊 查看数据: https://supabase.com/dashboard/project/${projectRef}/editor\n`)
    return
  }

  if (dbStatus.existing > 0) {
    console.log(`⚠️  数据库部分初始化 (${dbStatus.existing}/${dbStatus.total} 张表)\n`)
    console.log('   已存在的表:', dbStatus.tables.join(', '), '\n')
  } else {
    console.log('📋 数据库未初始化\n')
  }

  console.log('═'.repeat(65))
  console.log('\n🎯 一键初始化方案:\n')

  // 方案 A: 合并 SQL 文件
  console.log('【方案 A】复制粘贴一次完成（推荐）\n')

  const combinedSqlPath = createCombinedSql()
  console.log(`   ✓ 已生成合并 SQL 文件:`)
  console.log(`     ${combinedSqlPath}\n`)

  console.log('   步骤:')
  console.log('   1. 自动打开 SQL Editor（按回车）')
  console.log(`   2. 复制 scripts/combined_setup.sql 的内容`)
  console.log('   3. 粘贴到 SQL Editor 并点击 Run\n')

  // 方案 B: 分步执行
  console.log('【方案 B】分步执行（更安全）\n')
  console.log('   步骤:')
  console.log('   1. 打开 SQL Editor')
  console.log('   2. 依次执行 4 个 SQL 文件\n')
  console.log(`   详见: docs/QUICK_START.md\n`)

  console.log('═'.repeat(65))
  console.log('\n📌 按回车自动打开 Supabase SQL Editor...')
  console.log('   (或按 Ctrl+C 取消)\n')

  // 等待用户按回车
  await new Promise(resolve => {
    process.stdin.once('data', resolve)
  })

  const sqlEditorUrl = `https://supabase.com/dashboard/project/${projectRef}/sql/new`

  console.log('🌐 正在打开浏览器...\n')

  const opened = await openBrowser(sqlEditorUrl)

  if (opened) {
    console.log('✅ 已在浏览器中打开 SQL Editor\n')
  } else {
    console.log('⚠️  无法自动打开浏览器\n')
    console.log(`   请手动访问: ${sqlEditorUrl}\n`)
  }

  console.log('═'.repeat(65))
  console.log('\n📝 接下来的步骤:\n')
  console.log('1️⃣  在打开的 SQL Editor 中\n')
  console.log('2️⃣  复制以下文件的内容:\n')
  console.log('   🔹 方案 A: scripts/combined_setup.sql (一次性)')
  console.log('   🔹 方案 B: 依次复制 scripts/001~004.sql (分步)\n')
  console.log('3️⃣  粘贴到 SQL Editor\n')
  console.log('4️⃣  点击 "Run" 按钮执行\n')
  console.log('5️⃣  执行完成后，运行以下命令验证:\n')
  console.log('   node scripts/auto-setup.mjs\n')
  console.log('═'.repeat(65))
  console.log('\n💡 提示:')
  console.log('   • 查看合并文件: cat scripts/combined_setup.sql')
  console.log('   • 详细教程: docs/QUICK_START.md')
  console.log(`   • 数据查看: https://supabase.com/dashboard/project/${projectRef}/editor\n`)
}

main().catch(err => {
  console.error('\n❌ 错误:', err.message)
  process.exit(1)
})
