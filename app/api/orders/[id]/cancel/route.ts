import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromRequest } from '@/lib/middleware'
import { dbGet, dbRun, dbQuery } from '@/lib/db-utils'
import { verifyToken } from '@/lib/auth'

// POST - 取消订单
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
      SELECT id, status
      FROM orders
      WHERE id = ? AND user_id = ?
    `, [id, decoded.userId])

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.status !== 'pending') {
      return NextResponse.json({ error: 'Order cannot be cancelled' }, { status: 400 })
    }

    // 获取订单项并恢复库存
    const orderItems = dbQuery(`
      SELECT ticket_id, quantity
      FROM order_items
      WHERE order_id = ?
    `, [id])

    // 恢复库存
    for (const item of orderItems) {
      dbRun(`
        UPDATE tickets
        SET stock = stock + ?
        WHERE id = ?
      `, [item.quantity, item.ticket_id])
    }

    // 更新订单状态为已取消
    dbRun(`
      UPDATE orders
      SET status = 'cancelled'
      WHERE id = ?
    `, [id])

    return NextResponse.json({
      success: true,
      message: 'Order cancelled successfully'
    })

  } catch (error) {
    console.error('Error cancelling order:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
