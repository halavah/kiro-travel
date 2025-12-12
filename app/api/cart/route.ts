import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { dbQuery, dbGet, dbRun } from '@/lib/db-utils'
import { randomUUID } from 'crypto'

// GET - 获取购物车列表
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value

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

    // #region agent log
    // 记录原始购物车数据结构
    fetch('http://127.0.0.1:7244/ingest/3d36902f-c49a-4d79-9c89-7a13eac53de2', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'api/cart/route.ts:50', message: '原始购物车数据结构', data: { cartItems: cartItems.slice(0, 2), count: cartItems.length }, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId: 'A' }) }).catch(() => { });
    // #endregion

    // 转换数据结构以匹配组件期望
    const items = cartItems.map((item: any) => {
      // #region agent log
      // 记录每个购物车项的转换过程
      fetch('http://127.0.0.1:7244/ingest/3d36902f-c49a-4d79-9c89-7a13eac53de2', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'api/cart/route.ts:58', message: '购物车项数据转换', data: { itemId: item.id, hasTicketId: !!item.ticket_id, hasSpotId: !!item.spot_id }, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId: 'A,B' }) }).catch(() => { });
      // #endregion

      return {
        id: item.id,
        user_id: decoded.userId,
        ticket_id: item.ticket_id,
        quantity: item.quantity,
        created_at: item.created_at,
        ticket: item.ticket_id ? {
          id: item.ticket_id,
          name: item.ticket_name,
          description: item.ticket_description,
          price: item.ticket_price,
          stock: item.ticket_stock,
          valid_from: item.valid_from,
          valid_to: item.valid_to,
          is_active: item.is_active,
          spot: item.spot_id ? {
            id: item.spot_id,
            name: item.spot_name,
            location: item.spot_location,
            images: item.spot_images ? JSON.parse(item.spot_images) : []
          } : undefined
        } : undefined
      }
    })

    // #region agent log
    // 记录转换后的购物车数据结构
    fetch('http://127.0.0.1:7244/ingest/3d36902f-c49a-4d79-9c89-7a13eac53de2', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'api/cart/route.ts:82', message: '转换后的购物车数据结构', data: { items: items.slice(0, 2), count: items.length }, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId: 'A,B' }) }).catch(() => { });
    // #endregion

    // 计算总价
    const totalAmount = items.reduce((sum: number, item: any) => {
      return sum + ((item.ticket?.price || 0) * item.quantity)
    }, 0)

    return NextResponse.json({
      data: items,
      totalAmount,
      count: items.length
    })

  } catch (error) {
    console.error('Error fetching cart:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - 添加商品到购物车
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value

    // #region agent log
    // 记录添加到购物车尝试
    fetch('http://127.0.0.1:7244/ingest/3d36902f-c49a-4d79-9c89-7a13eac53de2', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'api/cart/route.ts:107', message: '添加到购物车尝试', data: { hasToken: !!token, tokenLength: token?.length }, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId: 'A' }) }).catch(() => { });
    // #endregion

    if (!token) {
      // #region agent log
      // 记录token缺失
      fetch('http://127.0.0.1:7244/ingest/3d36902f-c49a-4d79-9c89-7a13eac53de2', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'api/cart/route.ts:110', message: 'token缺失', data: {}, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId: 'A' }) }).catch(() => { });
      // #endregion

      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)

    // #region agent log
    // 记录token验证结果
    fetch('http://127.0.0.1:7244/ingest/3d36902f-c49a-4d79-9c89-7a13eac53de2', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'api/cart/route.ts:116', message: 'token验证结果', data: { hasDecoded: !!decoded, userId: decoded?.userId }, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId: 'A' }) }).catch(() => { });
    // #endregion

    if (!decoded) {
      // #region agent log
      // 记录token验证失败
      fetch('http://127.0.0.1:7244/ingest/3d36902f-c49a-4d79-9c89-7a13eac53de2', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'api/cart/route.ts:119', message: 'token验证失败', data: {}, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId: 'A' }) }).catch(() => { });
      // #endregion

      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body: await req.json()
    const { ticket_id, quantity = 1 } = body

    // #region agent log
    // 记录请求体
    fetch('http://127.0.0.1:7244/ingest/3d36902f-c49a-4d79-9c89-7a13eac53de2', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'api/cart/route.ts:121', message: '请求体', data: { ticket_id, quantity }, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId: 'A' }) }).catch(() => { });
    // #endregion

    // 验证输入
    if (!ticket_id) {
      // #region agent log
      // 记录ticket_id缺失
      fetch('http://127.0.0.1:7244/ingest/3d36902f-c49a-4d79-9c89-7a13eac53de2', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'api/cart/route.ts:122', message: 'ticket_id缺失', data: {}, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId: 'A' }) }).catch(() => { });
      // #endregion

      return NextResponse.json({ error: 'ticket_id is required' }, { status: 400 })
    }

    if (quantity < 1) {
      // #region agent log
      // 记录数量不足
      fetch('http://127.0.0.1:7244/ingest/3d36902f-c49a-4d79-9c89-7a13eac53de2', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'api/cart/route.ts:126', message: '数量不足', data: {}, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId: 'A' }) }).catch(() => { });
      // #endregion

      return NextResponse.json({ error: 'Quantity must be at least 1' }, { status: 400 })
    }

    // 检查门票是否存在且有库存
    const ticket = dbGet(`
      SELECT id, name, price, stock, status
      FROM tickets
      WHERE id = ?
    `, [ticket_id])

    // #region agent log
    // 记录门票查询结果
    fetch('http://127.0.0.1:7244/ingest/3d36902f-c49a-4d79-9c89-7a13eac53de2', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'api/cart/route.ts:133', message: '门票查询结果', data: { hasTicket: !!ticket, ticketStatus: ticket?.status }, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId: 'A' }) }).catch(() => { });
    // #endregion

    if (!ticket) {
      // #region agent log
      // 记录门票不存在
      fetch('http://127.0.0.1:7244/ingest/3d36902f-c49a-4d79-9c89-7a13eac53de2', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'api/cart/route.ts:138', message: '门票不存在', data: {}, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId: 'A' }) }).catch(() => { });
      // #endregion

      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    if (!ticket.status) {
      // #region agent log
      // 记录门票不可用
      fetch('http://127.0.0.1:7244/ingest/3d36902f-c49a-4d79-9c89-7a13eac53de2', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'api/cart/route.ts:141', message: '门票不可用', data: {}, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId: 'A' }) }).catch(() => { });
      // #endregion

      return NextResponse.json({ error: 'Ticket is not available' }, { status: 400 })
    }

    if (ticket.stock < quantity) {
      // #region agent log
      // 记录库存不足
      fetch('http://127.0.0.1:7244/ingest/3d36902f-c49a-4d79-9c89-7a13eac53de2', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'api/cart/route.ts:145', message: '库存不足', data: { available: ticket.stock, requested: quantity }, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId: 'A' }) }).catch(() => { });
      // #endregion

      return NextResponse.json({
        error: 'Insufficient stock',
        available: ticket.stock
      }, { status: 400 })
    }

    // 添加到购物车
    const cartItemId = randomUUID()
    const { lastInsertRowid } = dbRun(`
      INSERT INTO cart_items (id, user_id, ticket_id, quantity, created_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `, [cartItemId, decoded.userId, ticket_id, quantity])

    // #region agent log
    // 记录数据库插入结果
    fetch('http://127.0.0.1:7244/ingest/3d36902f-c49a-4d79-9c89-7a13eac53de2', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'api/cart/route.ts:158', message: '数据库插入结果', data: { lastInsertRowid, changes }, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId: 'A' }) }).catch(() => { });
    // #endregion

    return NextResponse.json({
      success: true,
      message: 'Item added to cart',
      item_id: cartItemId
    }, { status: 201 })
  } catch (error) {
    console.error('Error adding to cart:', error)

    // #region agent log
    // 记录添加到购物车错误
    fetch('http://127.0.0.1:7244/ingest/3d36902f-c49a-4d79-9c89-7a13eac53de2', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'api/cart/route.ts:165', message: '添加到购物车错误', data: { error: error?.message }, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId: 'A' }) }).catch(() => { });
    // #endregion

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - 清空购物车
export async function DELETE(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value

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
