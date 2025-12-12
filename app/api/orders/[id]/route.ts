import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { dbQuery, dbGet, dbRun } from '@/lib/db-utils'

// GET - 获取订单详情
export async function GET(
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

    // 查询订单基本信息
    const order = dbGet(`
      SELECT
        o.id,
        o.order_no,
        o.total_amount,
        o.status,
        o.paid_at,
        o.created_at,
        p.username,
        p.email
      FROM orders o
      LEFT JOIN profiles p ON o.user_id = p.id
      WHERE o.id = ? AND o.user_id = ?
    `, [id, decoded.userId])

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
    console.error('Error fetching order:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH - 更新订单状态
export async function PATCH(
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
    const { status } = await req.json()

    // 验证状态值
    const validStatuses = ['pending', 'paid', 'cancelled', 'completed']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
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

    // 检查状态转换是否合法
    if (order.status === 'cancelled' || order.status === 'completed') {
      return NextResponse.json({
        error: 'Cannot update completed or cancelled order'
      }, { status: 400 })
    }

    // 如果是支付状态，记录支付时间
    if (status === 'paid') {
      dbRun(`
        UPDATE orders
        SET status = ?, paid_at = datetime('now')
        WHERE id = ?
      `, [status, id])
    } else {
      dbRun(`
        UPDATE orders
        SET status = ?
        WHERE id = ?
      `, [status, id])
    }

    return NextResponse.json({
      success: true,
      message: 'Order status updated'
    })

  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - 取消订单（恢复库存）
export async function DELETE(
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
      SELECT id, status
      FROM orders
      WHERE id = ? AND user_id = ?
    `, [id, decoded.userId])

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // 只能取消待支付的订单
    if (order.status !== 'pending') {
      return NextResponse.json({
        error: 'Only pending orders can be cancelled'
      }, { status: 400 })
    }

    // 获取订单项，用于恢复库存
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
      message: 'Order cancelled and stock restored'
    })

  } catch (error) {
    console.error('Error cancelling order:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
