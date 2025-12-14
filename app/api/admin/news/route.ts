import { NextRequest, NextResponse } from 'next/server'
import { dbQuery } from '@/lib/db-utils'
import { validateAuth, checkRole } from '@/lib/auth'

// GET /api/admin/news - 获取所有新闻（管理员）
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await validateAuth(request)

    if (!user) {
      return NextResponse.json(
        { success: false, error: error || '请先登录' },
        { status: 401 }
      )
    }

    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: '权限不足' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const status = searchParams.get('status')

    let whereClause = 'WHERE 1=1'
    const params: any[] = []

    if (category && category !== 'all') {
      whereClause += ' AND n.category_id = ?'
      params.push(category)
    }

    if (status === 'published') {
      whereClause += ' AND n.is_published = 1'
    } else if (status === 'draft') {
      whereClause += ' AND n.is_published = 0'
    }

    const sql = `
      SELECT
        n.*,
        nc.name as category_name,
        p.full_name as author_name
      FROM news n
      LEFT JOIN news_categories nc ON n.category_id = nc.id
      LEFT JOIN profiles p ON n.author_id = p.id
      ${whereClause}
      ORDER BY n.created_at DESC
    `

    const news = dbQuery(sql, params)

    return NextResponse.json({
      success: true,
      data: news
    })
  } catch (error) {
    console.error('Error fetching news:', error)
    return NextResponse.json(
      { success: false, error: '获取新闻列表失败' },
      { status: 500 }
    )
  }
}
