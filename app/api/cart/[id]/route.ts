import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromRequest } from '@/lib/middleware'
import { dbGet, dbRun } from '@/lib/db-utils'
import { verifyToken } from '@/lib/auth'

// PATCH - 更新购物车商品数量
export async function PATCH(
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

    const { id } = await params
    const body = await req.json()
    const { quantity } = body

    // 验证输入
    if (quantity === undefined || quantity < 0) {
      return NextResponse.json({
        error: 'Valid quantity is required (must be >= 0)'
      }, { status: 400 })
    }

    // 如果数量为 0，删除商品
    if (quantity === 0) {
      dbRun(`
        DELETE FROM cart_items
        WHERE id = ? AND user_id = ?
      `, [id, decoded.userId])

      return NextResponse.json({
        success: true,
        message: 'Item removed from cart'
      })
    }

    // 检查购物车项是否存在且属于当前用户
    const cartItem = dbGet(`
      SELECT ci.id, ci.ticket_id, ci.quantity
      FROM cart_items ci
      WHERE ci.id = ? AND ci.user_id = ?
    `, [id, decoded.userId])

    if (!cartItem) {
      return NextResponse.json({ error: 'Cart item not found' }, { status: 404 })
    }

    // 检查门票库存
    const ticket = dbGet(`
      SELECT stock, status
      FROM tickets
      WHERE id = ?
    `, [cartItem.ticket_id])

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    if (ticket.status !== 'active') {
      return NextResponse.json({ error: 'Ticket is not available' }, { status: 400 })
    }

    if (quantity > ticket.stock) {
      return NextResponse.json({
        error: 'Insufficient stock',
        available: ticket.stock
      }, { status: 400 })
    }

    // 更新数量
    dbRun(`
      UPDATE cart_items
      SET quantity = ?
      WHERE id = ?
    `, [quantity, id])

    return NextResponse.json({
      success: true,
      message: 'Cart item updated',
      quantity
    })

  } catch (error) {
    console.error('Error updating cart item:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - 删除单个购物车商品
export async function DELETE(
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

    const { id } = await params

    // 检查是否存在且属于当前用户
    const cartItem = dbGet(`
      SELECT id FROM cart_items
      WHERE id = ? AND user_id = ?
    `, [id, decoded.userId])

    if (!cartItem) {
      return NextResponse.json({ error: 'Cart item not found' }, { status: 404 })
    }

    // 删除
    dbRun(`DELETE FROM cart_items WHERE id = ?`, [id])

    return NextResponse.json({
      success: true,
      message: 'Item removed from cart'
    })

  } catch (error) {
    console.error('Error deleting cart item:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
