import { initDatabase } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/init-db - 初始化数据库
export async function GET() {
  try {
    initDatabase()
    return NextResponse.json({
      success: true,
      message: '数据库初始化成功',
    })
  } catch (error) {
    console.error('数据库初始化失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: '数据库初始化失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    )
  }
}
