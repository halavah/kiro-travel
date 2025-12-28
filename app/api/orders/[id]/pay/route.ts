import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromRequest } from '@/lib/middleware'
import { dbGet, dbRun } from '@/lib/db-utils'
import { verifyToken } from '@/lib/auth'

// POST - 支付订单
export async function POST(
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

    // 检查订单是否存在且属于当前用户
    const order = dbGet(`
      SELECT id, status, total_amount
      FROM orders
      WHERE id = ? AND user_id = ?
    `, [id, decoded.userId])

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.status !== 'pending') {
      return NextResponse.json({ error: 'Order cannot be paid' }, { status: 400 })
    }

    // 更新订单状态为已支付
    dbRun(`
      UPDATE orders
      SET status = 'paid', paid_at = datetime('now')
      WHERE id = ?
    `, [id])

    return NextResponse.json({
      success: true,
      message: 'Payment successful'
    })

  } catch (error) {
    console.error('Error paying order:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
