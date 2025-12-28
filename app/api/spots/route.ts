import { NextRequest, NextResponse } from 'next/server'
import { dbQuery, paginate, dbRun } from '@/lib/db-utils'
import { validateAuth, checkRole } from '@/lib/auth'

// GET /api/spots - 获取景点列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const isRecommended = searchParams.get('is_recommended') === 'true'

    let whereClause = "WHERE s.status = 'active'"
    const params: any[] = []

    // Use FTS5 for full-text search when search query is provided
    if (search) {
      // Use FTS5 virtual table for much faster search
      const ftsQuery = search.split(' ').map(term => `"${term.trim()}"`).join(' OR ')
      whereClause += ' AND s.id IN (SELECT id FROM spots_fts WHERE spots_fts MATCH ?)'
      params.push(ftsQuery)
    }

    if (category) {
      whereClause += ' AND sc.name = ?'
      params.push(category)
    }

    if (isRecommended) {
      whereClause += ' AND s.is_recommended = 1'
    }

    // spot_likes, spot_favorites, spot_comments 表不存在，暂时移除这些关联查询
    const sql = `
      SELECT
        s.*,
        sc.name as category_name,
        0 as like_count,
        0 as favorite_count,
        0 as average_rating
      FROM spots s
      LEFT JOIN spot_categories sc ON s.category_id = sc.id
      ${whereClause}
      ORDER BY s.created_at DESC
    `

    const result = paginate(sql, page, limit, params)

    // 解析 images JSON 字段并格式化数据
    const spotsWithParsedImages = result.data.map((spot: any) => ({
      ...spot,
      images: spot.images ? JSON.parse(spot.images) : [],
      category: spot.category_name ? { name: spot.category_name } : null
    }))

    return NextResponse.json({
      success: true,
      data: spotsWithParsedImages,
      pagination: result.pagination
    })
  } catch (error) {
    console.error('Error fetching spots:', error)
    // 返回更详细的错误信息（仅在开发环境）
    const isDev = process.env.NODE_ENV !== 'production'
    return NextResponse.json(
      {
        success: false,
        error: '获取景点列表失败',
        ...(isDev && { details: error instanceof Error ? error.message : String(error) })
      },
      { status: 500 }
    )
  }
}

// POST /api/spots - 创建新景点
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await validateAuth(request)

    if (!user) {
      return NextResponse.json(
        { success: false, error: error || '请先登录' },
        { status: 401 }
      )
    }

    // 检查权限
    if (!checkRole(user.role, 'guide')) {
      return NextResponse.json(
        { success: false, error: '权限不足' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, description, category_id, location, price, images } = body

    if (!name || !description || !category_id || !location) {
      return NextResponse.json(
        { success: false, error: '缺少必填字段' },
        { status: 400 }
      )
    }

    const sql = `
      INSERT INTO spots (name, description, category_id, location, price, images, status)
      VALUES (?, ?, ?, ?, ?, ?, 'active')
    `
    const { lastInsertRowid } = dbRun(sql, [
      name,
      description,
      category_id,
      location,
      price || 0,
      JSON.stringify(images || [])
    ])

    // 获取创建的景点信息
    const newSpot = dbQuery(`
      SELECT s.*, sc.name as category_name
      FROM spots s
      LEFT JOIN spot_categories sc ON s.category_id = sc.id
      WHERE s.id = ?
    `, [lastInsertRowid])[0]

    return NextResponse.json({
      success: true,
      data: newSpot,
      message: '景点创建成功'
    })
  } catch (error) {
    console.error('Error creating spot:', error)
    return NextResponse.json(
      { success: false, error: '创建景点失败' },
      { status: 500 }
    )
  }
}