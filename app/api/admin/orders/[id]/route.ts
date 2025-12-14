import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getTokenFromRequest } from '@/lib/middleware'
import { dbQuery, dbGet } from '@/lib/db-utils'

// GET - 获取订单详情（管理员）
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    // 查询订单基本信息
    const order = dbGet(`
      SELECT
        o.id,
        o.order_no,
        o.total_amount,
        o.status,
        o.paid_at,
        o.created_at,
        p.full_name as username,
        p.email,
        p.phone
      FROM orders o
      LEFT JOIN profiles p ON o.user_id = p.id
      WHERE o.id = ?
    `, [id])

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // 查询订单项
    const orderItems = dbQuery(`
      SELECT
        oi.id,
        oi.ticket_name,
        oi.spot_name,
        oi.price,
        oi.quantity,
        oi.created_at
      FROM order_items oi
      WHERE oi.order_id = ?
      ORDER BY oi.created_at ASC
    `, [id])

    return NextResponse.json({
      order: {
        ...order,
        items: orderItems
      }
    })

  } catch (error) {
    console.error('Error fetching admin order:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}