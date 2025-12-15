import { NextResponse } from 'next/server'
import { initDatabase } from '@/lib/db'

export const dynamic = 'force-dynamic'

// 手动触发数据库初始化的 API 端点
export async function POST() {
  try {
    console.log('🔧 收到手动初始化数据库请求...')

    // 执行数据库初始化
    initDatabase()

    return NextResponse.json({
      success: true,
      message: '数据库初始化成功！所有表和测试数据已创建。'
    })
  } catch (error: any) {
    console.error('❌ 数据库初始化失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || '数据库初始化失败',
        details: error.toString()
      },
      { status: 500 }
    )
  }
}

// 检查数据库初始化状态
export async function GET() {
  try {
    const Database = require('better-sqlite3')
    const { join } = require('path')
    const { existsSync } = require('fs')

    // 获取数据库路径
    const dbPath = process.env.DATABASE_PATH || join(process.cwd(), 'data', 'database.sqlite')

    // 检查数据库文件是否存在
    const dbExists = existsSync(dbPath)

    if (!dbExists) {
      return NextResponse.json({
        initialized: false,
        message: '数据库文件不存在',
        path: dbPath
      })
    }

    // 检查表是否存在
    const db = new Database(dbPath)
    const tables = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    ).all()
    db.close()

    const requiredTables = [
      'profiles', 'categories', 'spots', 'tickets', 'activities',
      'hotels', 'hotel_rooms', 'orders', 'news', 'news_categories'
    ]

    const existingTables = tables.map((t: any) => t.name)
    const missingTables = requiredTables.filter(t => !existingTables.includes(t))

    return NextResponse.json({
      initialized: missingTables.length === 0,
      path: dbPath,
      totalTables: tables.length,
      existingTables,
      missingTables,
      message: missingTables.length === 0
        ? '数据库已完全初始化'
        : `缺少 ${missingTables.length} 个表`
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        initialized: false,
        error: error.message,
        details: error.toString()
      },
      { status: 500 }
    )
  }
}
