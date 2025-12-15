import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // 测试数据库连接
    const result = db.prepare('SELECT 1 as ok').get() as { ok: number } | undefined

    // 获取数据库文件路径
    const dbPath = process.env.DATABASE_PATH || './data/database.sqlite'

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: {
        connected: !!result,
        path: dbPath
      },
      environment: process.env.NODE_ENV || 'development'
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        message: error instanceof Error ? error.message : 'Database connection failed'
      },
      { status: 500 }
    )
  }
}
