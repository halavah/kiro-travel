import { NextRequest, NextResponse } from 'next/server'
import { dbQuery, paginate, dbRun } from '@/lib/db-utils'
import { validateAuth, checkRole } from '@/lib/auth'

// GET /api/spots - 获取景点列表
export async function GET(request: NextRequest) {
  console.log('✅ Spots API GET called!')
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const isRecommended = searchParams.get('is_recommended') === 'true'

    console.log('Query params:', { page, limit, search, category, isRecommended })

    let whereClause = 'WHERE s.status = 1'
    const params: any[] = []

    if (search) {
      whereClause += ' AND (s.name LIKE ? OR s.description LIKE ?)'
      params.push(`%${search}%`, `%${search}%`)
    }

    if (category) {
      whereClause += ' AND sc.name = ?'
      params.push(category)
    }

    if (isRecommended) {
      whereClause += ' AND s.is_recommended = 1'
    }

    const sql = `
      SELECT
        s.*,
        sc.name as category_name,
        COUNT(DISTINCT sl.id) as like_count,
        COUNT(DISTINCT sf.id) as favorite_count,
        IFNULL(AVG(sco.rating), 0) as average_rating
      FROM spots s
      LEFT JOIN spot_categories sc ON s.category_id = sc.id
      LEFT JOIN spot_likes sl ON s.id = sl.spot_id
      LEFT JOIN spot_favorites sf ON s.id = sf.spot_id
      LEFT JOIN spot_comments sco ON s.id = sco.spot_id
      ${whereClause}
      GROUP BY s.id
      ORDER BY s.created_at DESC
    `

    const result = paginate(sql, page, limit, params)

    return NextResponse.json({
      success: true,
      ...result
    })
  } catch (error) {
    console.error('Error fetching spots:', error)
    return NextResponse.json(
      { success: false, error: '获取景点列表失败' },
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
      INSERT INTO spots (name, description, category_id, location, price, images, status, created_by)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?)
    `
    const { lastInsertRowid } = dbRun(sql, [
      name,
      description,
      category_id,
      location,
      price || 0,
      JSON.stringify(images || []),
      user.id
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