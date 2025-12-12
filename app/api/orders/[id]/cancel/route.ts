import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { dbGet, dbRun, dbQuery } from '@/lib/db-utils'

// POST - 取消订单
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
      return NextResponse.json({ error: 'Order cannot be cancelled' }, { status: 400 })
    }

    // 获取订单项以恢复库存
    const orderItems = dbQuery(`
      SELECT ticket_id, quantity
      FROM order_items
      WHERE order_id = ?
    `, [id])

    // 恢复门票库存
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

    // 返回更新后的订单
    const updatedOrder = dbGet(`
      SELECT id, order_no, total_amount, status, created_at
      FROM orders
      WHERE id = ?
    `, [id])

    return NextResponse.json({
      success: true,
      data: updatedOrder,
      message: 'Order cancelled successfully'
    })

  } catch (error) {
    console.error('Error cancelling order:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
