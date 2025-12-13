import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromRequest } from '@/lib/middleware'
import { dbQuery, dbGet } from '@/lib/db-utils'
import { verifyToken } from '@/lib/auth'

// GET - 获取订单详情
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const token = getTokenFromRequest(req)

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // 获取订单详情
    const order = dbGet(`
      SELECT
        o.id,
        o.order_no,
        o.total_amount,
        o.status,
        o.paid_at,
        o.created_at,
        o.note
      FROM orders o
      WHERE o.id = ? AND o.user_id = ?
    `, [id, decoded.userId])

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // 获取订单项
    const items = dbQuery(`
      SELECT
        oi.id,
        oi.ticket_name,
        oi.spot_name,
        oi.price,
        oi.quantity,
        oi.created_at
      FROM order_items oi
      WHERE oi.order_id = ?
      ORDER BY oi.created_at
    `, [id])

    return NextResponse.json({
      order: {
        ...order,
        items
      }
    })

  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
