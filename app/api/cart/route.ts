import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromRequest } from '@/lib/middleware'
import { dbQuery, dbGet, dbRun } from '@/lib/db-utils'
import { verifyToken } from '@/lib/auth'
import { randomUUID } from 'crypto'

// GET - 获取购物车列表
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

    // 查询购物车，关联门票和景点信息
    const cartItems = dbQuery(`
      SELECT
        ci.id,
        ci.quantity,
        ci.created_at,
        t.id as ticket_id,
        t.name as ticket_name,
        t.description as ticket_description,
        t.price as ticket_price,
        t.stock as ticket_stock,
        t.valid_from,
        t.valid_to,
        t.status,
        s.id as spot_id,
        s.name as spot_name,
        s.location as spot_location,
        s.images as spot_images
      FROM cart_items ci
      LEFT JOIN tickets t ON ci.ticket_id = t.id
      LEFT JOIN spots s ON t.spot_id = s.id
      WHERE ci.user_id = ?
      ORDER BY ci.created_at DESC
    `, [decoded.userId])

    // 转换数据结构以匹配组件期望
    const items = cartItems.map((item: any) => {
      return {
        id: item.id.toString(),
        quantity: item.quantity,
        ticket_id: item.ticket_id.toString(),
        ticket_name: item.ticket_name,
        ticket_description: item.ticket_description,
        ticket_price: item.ticket_price,
        ticket_stock: item.ticket_stock,
        spot_id: item.spot_id?.toString(),
        spot_name: item.spot_name,
        spot_location: item.spot_location,
        spot_images: item.spot_images ? JSON.parse(item.spot_images) : []
      }
    })

    // 计算总价
    const totalAmount = items.reduce((sum: number, item: any) => {
      return sum + ((item.ticket_price || 0) * item.quantity)
    }, 0)

    return NextResponse.json({
      success: true,
      items,
      totalAmount
    })

  } catch (error) {
    console.error('Error fetching cart:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - 添加商品到购物车
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

    const body = await req.json()
    const { ticket_id, quantity = 1 } = body

    // 验证输入
    if (!ticket_id) {
      return NextResponse.json({ error: 'ticket_id is required' }, { status: 400 })
    }

    if (quantity < 1) {
      return NextResponse.json({ error: 'Quantity must be at least 1' }, { status: 400 })
    }

    // 检查门票是否存在且有库存
    const ticket = dbGet(`
      SELECT id, name, price, stock, status
      FROM tickets
      WHERE id = ?
    `, [ticket_id])

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    if (!ticket.status) {
      return NextResponse.json({ error: 'Ticket is not available' }, { status: 400 })
    }

    if (ticket.stock < quantity) {
      return NextResponse.json({
        error: 'Insufficient stock',
        available: ticket.stock
      }, { status: 400 })
    }

    // 检查门票是否已在购物车中
    const existingItem = dbGet(`
      SELECT id, quantity FROM cart_items
      WHERE user_id = ? AND ticket_id = ?
    `, [decoded.userId, ticket_id])

    if (existingItem) {
      // 更新数量
      const newQuantity = existingItem.quantity + quantity
      dbRun(`
        UPDATE cart_items
        SET quantity = ?
        WHERE id = ?
      `, [newQuantity, existingItem.id])

      return NextResponse.json({
        success: true,
        message: 'Cart item updated',
        item_id: existingItem.id,
        quantity: newQuantity
      }, { status: 200 })
    }

    // 添加到购物车
    const cartItemId = randomUUID()
    const { lastInsertRowid } = dbRun(`
      INSERT INTO cart_items (id, user_id, ticket_id, quantity, created_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `, [cartItemId, decoded.userId, ticket_id, quantity])

    return NextResponse.json({
      success: true,
      message: 'Item added to cart',
      item_id: cartItemId
    }, { status: 201 })
  } catch (error) {
    console.error('Error adding to cart:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - 清空购物车
export async function DELETE(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req)

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    dbRun(`DELETE FROM cart_items WHERE user_id = ?`, [decoded.userId])

    return NextResponse.json({
      success: true,
      message: 'Cart cleared'
    })

  } catch (error) {
    console.error('Error clearing cart:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
