import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getTokenFromRequest } from '@/lib/middleware'
import { dbQuery, dbGet, dbRun } from '@/lib/db-utils'

// GET - 获取所有门票（管理员）
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
    const status = searchParams.get('status')

    // 构建查询条件
    let whereClauses = ['1=1']
    let queryParams: any[] = []

    if (status && status !== 'all') {
      whereClauses.push('t.status = ?')
      queryParams.push(status)
    }

    const whereClause = whereClauses.join(' AND ')

    // 查询门票列表
    const tickets = dbQuery(`
      SELECT
        t.id,
        t.name,
        t.description,
        t.price,
        t.stock,
        t.status,
        t.valid_from,
        t.valid_to,
        t.created_at,
        t.spot_id,
        s.name as spot_name,
        s.location as spot_location,
        COALESCE(SUM(oi.quantity), 0) as sold_count
      FROM tickets t
      LEFT JOIN spots s ON t.spot_id = s.id
      LEFT JOIN order_items oi ON t.id = oi.ticket_id
      WHERE ${whereClause}
      GROUP BY t.id
      ORDER BY t.created_at DESC
    `, queryParams)

    return NextResponse.json({ tickets })

  } catch (error) {
    console.error('Error fetching admin tickets:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - 创建门票（管理员）
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
    const { name, description, price, stock, spot_id, valid_from, valid_to, status } = body

    // 验证必填字段
    if (!name || !price || !stock || !spot_id) {
      return NextResponse.json({
        error: 'Missing required fields: name, price, stock, spot_id'
      }, { status: 400 })
    }

    // 检查景点是否存在
    const spot = dbGet(`
      SELECT id FROM spots WHERE id = ?
    `, [spot_id])

    if (!spot) {
      return NextResponse.json({ error: 'Spot not found' }, { status: 404 })
    }

    // 创建门票
    const result = dbRun(`
      INSERT INTO tickets (
        name, description, price, stock, spot_id,
        valid_from, valid_to, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `, [
      name, description || null, price, stock, spot_id,
      valid_from || null, valid_to || null, status || 'active'
    ])

    const ticketId = result.lastInsertRowid

    // 获取创建的门票
    const ticket = dbGet(`
      SELECT t.*, s.name as spot_name, s.location as spot_location
      FROM tickets t
      LEFT JOIN spots s ON t.spot_id = s.id
      WHERE t.id = ?
    `, [ticketId])

    return NextResponse.json({
      success: true,
      ticket,
      message: 'Ticket created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating ticket:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}