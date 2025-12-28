import { NextRequest, NextResponse } from 'next/server'
import { dbQuery, paginate, dbRun } from '@/lib/db-utils'
import { validateAuth, checkRole } from '@/lib/auth'

// GET /api/tickets - 获取门票列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const spotId = searchParams.get('spot_id')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '100')
    const search = searchParams.get('search') || ''

    let whereClause = "WHERE t.status = 'active'"
    const params: any[] = []

    if (spotId) {
      whereClause += ' AND t.spot_id = ?'
      params.push(spotId)
    }

    if (search) {
      whereClause += ' AND (t.name LIKE ? OR t.description LIKE ?)'
      params.push(`%${search}%`, `%${search}%`)
    }

    const sql = `
      SELECT
        t.*,
        s.name as spot_name,
        s.location as spot_location
      FROM tickets t
      LEFT JOIN spots s ON t.spot_id = s.id
      ${whereClause}
      ORDER BY t.created_at DESC
    `

    const result = paginate(sql, page, limit, params)

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    })
  } catch (error) {
    console.error('Error fetching tickets:', error)
    return NextResponse.json(
      { success: false, error: '获取门票列表失败' },
      { status: 500 }
    )
  }
}

// POST /api/tickets - 创建新门票
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
    const { name, description, spot_id, price, stock, valid_from, valid_to } = body

    if (!name || !spot_id || !price) {
      return NextResponse.json(
        { success: false, error: '缺少必填字段' },
        { status: 400 }
      )
    }

    const sql = `
      INSERT INTO tickets (name, description, spot_id, price, stock, valid_from, valid_to, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
    `
    const { lastInsertRowid } = dbRun(sql, [
      name,
      description || null,
      spot_id,
      price,
      stock || 0,
      valid_from || null,
      valid_to || null
    ])

    // 获取创建的门票信息
    const newTicket = dbQuery(`
      SELECT t.*, s.name as spot_name
      FROM tickets t
      LEFT JOIN spots s ON t.spot_id = s.id
      WHERE t.id = ?
    `, [lastInsertRowid])[0]

    return NextResponse.json({
      success: true,
      data: newTicket,
      message: '门票创建成功'
    })
  } catch (error) {
    console.error('Error creating ticket:', error)
    return NextResponse.json(
      { success: false, error: '创建门票失败' },
      { status: 500 }
    )
  }
}
