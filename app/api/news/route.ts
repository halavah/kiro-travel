import { NextRequest, NextResponse } from 'next/server'
import { dbQuery, paginate, dbRun, dbGet } from '@/lib/db-utils'
import { validateAuth, checkRole } from '@/lib/auth'
import { randomUUID } from 'crypto'

// GET /api/news - 获取新闻列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const categoryId = searchParams.get('category_id') || ''
    const isPublished = searchParams.get('is_published')

    let whereClause = 'WHERE 1=1'
    const params: any[] = []

    // 默认只显示已发布的新闻，除非明确指定
    if (isPublished !== 'false') {
      whereClause += ' AND n.is_published = 1'
    }

    if (search) {
      whereClause += ' AND (n.title LIKE ? OR n.content LIKE ?)'
      params.push(`%${search}%`, `%${search}%`)
    }

    if (categoryId) {
      whereClause += ' AND n.category_id = ?'
      params.push(categoryId)
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
      ORDER BY n.published_at DESC
    `

    const result = paginate(sql, page, limit, params)

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    })
  } catch (error) {
    console.error('Error fetching news:', error)
    // 返回更详细的错误信息（仅在开发环境）
    const isDev = process.env.NODE_ENV !== 'production'
    return NextResponse.json(
      {
        success: false,
        error: '获取新闻列表失败',
        ...(isDev && { details: error instanceof Error ? error.message : String(error) })
      },
      { status: 500 }
    )
  }
}

// POST /api/news - 创建新闻 (管理员权限)
export async function POST(request: NextRequest) {
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
        { success: false, error: '需要管理员权限' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      title,
      content,
      summary,
      cover_image,
      category_id,
      is_published
    } = body

    // 验证必填字段
    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: '标题和内容为必填项' },
        { status: 400 }
      )
    }

    const id = randomUUID()
    const publishedAt = is_published ? new Date().toISOString() : null

    const sql = `
      INSERT INTO news (
        id, title, content, summary, cover_image, category_id,
        author_id, is_published, published_at, view_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `

    dbRun(sql, [
      id, title, content, summary, cover_image, category_id,
      user.id, is_published ? 1 : 0, publishedAt
    ])

    const news = dbGet(`
      SELECT n.*, nc.name as category_name, p.full_name as author_name
      FROM news n
      LEFT JOIN news_categories nc ON n.category_id = nc.id
      LEFT JOIN profiles p ON n.author_id = p.id
      WHERE n.id = ?
    `, [id])

    return NextResponse.json({
      success: true,
      data: news
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating news:', error)
    return NextResponse.json(
      { success: false, error: '创建新闻失败' },
      { status: 500 }
    )
  }
}
