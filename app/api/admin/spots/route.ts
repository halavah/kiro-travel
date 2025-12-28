import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getTokenFromRequest } from '@/lib/middleware'
import { dbQuery, dbGet, dbRun } from '@/lib/db-utils'

// GET - 获取所有景点（管理员）
export async function GET(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req)

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // 检查用户是否是管理员
    const user = dbGet(`
      SELECT role FROM profiles WHERE id = ?
    `, [decoded.userId])

    if (!user || (user.role !== 'admin' && user.role !== 'guide')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const status = searchParams.get('status')

    // 构建查询条件
    let whereClauses = ['1=1']
    let queryParams: any[] = []

    if (category && category !== 'all') {
      whereClauses.push('sc.name = ?')
      queryParams.push(category)
    }

    if (status && status !== 'all') {
      whereClauses.push('s.status = ?')
      queryParams.push(status)
    }

    const whereClause = whereClauses.join(' AND ')

    // 查询景点列表
    const spots = dbQuery(`
      SELECT
        s.id,
        s.name,
        s.description,
        s.location,
        s.price,
        s.rating,
        s.is_recommended,
        s.view_count,
        s.status,
        s.images,
        s.created_at,
        s.category_id,
        sc.name as category_name
      FROM spots s
      LEFT JOIN spot_categories sc ON s.category_id = sc.id
      WHERE ${whereClause}
      ORDER BY s.created_at DESC
    `, queryParams)

    // 解析图片字段
    const spotsWithParsedImages = spots.map((spot: any) => ({
      ...spot,
      images: spot.images ? JSON.parse(spot.images) : []
    }))

    return NextResponse.json({ spots: spotsWithParsedImages })

  } catch (error) {
    console.error('Error fetching admin spots:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - 创建景点（管理员）
export async function POST(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req)

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // 检查用户是否是管理员或导游
    const user = dbGet(`
      SELECT role FROM profiles WHERE id = ?
    `, [decoded.userId])

    if (!user || (user.role !== 'admin' && user.role !== 'guide')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { name, description, location, price, category_id, is_recommended, images } = body

    // 验证必填字段
    if (!name || !location || !price || !category_id) {
      return NextResponse.json({
        error: 'Missing required fields: name, location, price, category_id'
      }, { status: 400 })
    }

    // 获取分类ID
    let categoryId = category_id
    if (isNaN(categoryId)) {
      // 如果传入的是分类名称，获取分类ID
      const category = dbGet(`
        SELECT id FROM spot_categories WHERE name = ?
      `, [category_id])

      if (!category) {
        return NextResponse.json({ error: 'Category not found' }, { status: 404 })
      }
      categoryId = category.id
    }

    // 创建景点
    const result = dbRun(`
      INSERT INTO spots (
        name, description, location, price,
        category_id, is_recommended, images, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', datetime('now'))
    `, [
      name, description || null, location, price,
      categoryId, is_recommended ? 1 : 0,
      JSON.stringify(images || [])
    ])

    const spotId = result.lastInsertRowid

    // 获取创建的景点
    const spot = dbGet(`
      SELECT s.*, sc.name as category_name
      FROM spots s
      LEFT JOIN spot_categories sc ON s.category_id = sc.id
      WHERE s.id = ?
    `, [spotId])

    return NextResponse.json({
      success: true,
      spot,
      message: 'Spot created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating spot:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}