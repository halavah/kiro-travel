import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { dbGet, dbRun } from '@/lib/db-utils'

// POST - 支付订单
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { id } = await params

    // 检查订单是否存在且属于当前用户
    const order = dbGet(`
      SELECT id, user_id, status
      FROM orders
      WHERE id = ?
    `, [id])

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.user_id !== decoded.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
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

    // 返回更新后的订单
    const updatedOrder = dbGet(`
      SELECT id, order_no, total_amount, status, paid_at, created_at
      FROM orders
      WHERE id = ?
    `, [id])

    return NextResponse.json({
      success: true,
      data: updatedOrder,
      message: 'Payment successful'
    })

  } catch (error) {
    console.error('Error paying order:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
