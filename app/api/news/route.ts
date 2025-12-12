import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/news - 获取新闻列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const isPublished = searchParams.get('is_published') === 'true'

    let whereClause = '1=1'
    const params: any[] = []

    if (isPublished) {
      whereClause += ' AND is_published = 1'
    }

    // 查询总数
    const countStmt = db.prepare(`
      SELECT COUNT(*) as total
      FROM news
      WHERE ${whereClause}
    `)
    const { total } = countStmt.get(...params) as { total: number }

    // 查询数据
    const offset = (page - 1) * limit
    const stmt = db.prepare(`
      SELECT
        id,
        title,
        content,
        summary,
        cover_image,
        author_id,
        view_count,
        is_published,
        published_at,
        created_at,
        updated_at
      FROM news
      WHERE ${whereClause}
      ORDER BY published_at DESC
      LIMIT ? OFFSET ?
    `)

    const newsList = stmt.all(...params, limit, offset)

    // 格式化数据
    const formattedNews = newsList.map((news: any) => ({
      ...news,
      is_published: news.is_published === 1,
    }))

    return NextResponse.json({
      success: true,
      data: formattedNews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('获取新闻列表失败:', error)
    return NextResponse.json(
      { success: false, error: '获取新闻列表失败' },
      { status: 500 }
    )
  }
}
