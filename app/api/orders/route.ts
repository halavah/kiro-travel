import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromRequest } from '@/lib/middleware'
import { dbQuery, dbGet, dbRun } from '@/lib/db-utils'
import { verifyToken } from '@/lib/auth'
import { randomUUID } from 'crypto'

// GET - 获取订单列表
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

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    // 构建查询条件
    let whereClauses = ['o.user_id = ?']
    let queryParams: any[] = [decoded.userId]

    if (status && status !== 'all') {
      whereClauses.push('o.status = ?')
      queryParams.push(status)
    }

    const whereClause = whereClauses.join(' AND ')

    // 查询订单列表
    const orders = dbQuery(`
      SELECT
        o.id,
        o.order_no,
        o.total_amount,
        o.status,
        o.paid_at,
        o.created_at,
        COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE ${whereClause}
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `, queryParams)

    return NextResponse.json({ orders })

  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - 创建订单（从购物车或直接预订）
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

    // 获取请求体
    let body = {}
    try {
      body = await req.json()
    } catch (e) {
      // 如果没有请求体或请求体为空，使用空对象
      body = {}
    }
    const { cart_item_ids, spot_id, ticket_id, visitDate, visitTime, visitors, contactName, contactPhone, contactEmail, remarks } = body

    // 判断是从购物车创建订单还是直接预订
    let orderItems: any[] = []

    if (spot_id && ticket_id && visitors) {
      // 直接预订模式 - 验证必填字段
      if (!visitDate || !visitTime || !contactName || !contactPhone) {
        return NextResponse.json({
          error: '缺少必填字段：visitDate, visitTime, contactName, contactPhone'
        }, { status: 400 })
      }

      // 直接预订模式
      const ticket = dbGet(`
        SELECT
          t.id,
          t.name as ticket_name,
          t.price as ticket_price,
          t.stock as ticket_stock,
          t.status as ticket_status,
          s.name as spot_name
        FROM tickets t
        LEFT JOIN spots s ON t.spot_id = s.id
        WHERE t.id = ? AND t.spot_id = ? AND t.status = 'active'
      `, [ticket_id, spot_id])

      if (!ticket) {
        return NextResponse.json({ error: '门票不存在或已下架' }, { status: 400 })
      }

      if (ticket.ticket_stock < visitors) {
        return NextResponse.json({
          error: '库存不足',
          available: ticket.ticket_stock
        }, { status: 400 })
      }

      orderItems.push({
        ticket_id: ticket.id,
        ticket_name: ticket.ticket_name,
        spot_name: ticket.spot_name,
        price: ticket.ticket_price,
        quantity: visitors
      })
    } else {
      // 购物车模式
      // 构建购物车查询条件
      let cartQuery = `
        SELECT
          ci.id as cart_item_id,
          ci.quantity,
          t.id as ticket_id,
          t.name as ticket_name,
          t.price as ticket_price,
          t.stock as ticket_stock,
          t.status as ticket_status,
          s.name as spot_name
        FROM cart_items ci
        LEFT JOIN tickets t ON ci.ticket_id = t.id
        LEFT JOIN spots s ON t.spot_id = s.id
        WHERE ci.user_id = ?
      `
      const cartParams: any[] = [decoded.userId]

      // 如果指定了特定的购物车商品ID，只获取这些商品
      if (cart_item_ids && Array.isArray(cart_item_ids) && cart_item_ids.length > 0) {
        const placeholders = cart_item_ids.map(() => '?').join(',')
        cartQuery += ` AND ci.id IN (${placeholders})`
        cartParams.push(...cart_item_ids)
      }

      // 获取购物车商品
      const cartItems = dbQuery(cartQuery, cartParams)

      if (!cartItems || cartItems.length === 0) {
        return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
      }

      // 验证库存并添加到订单项
      for (const item of cartItems) {
        if (item.ticket_status !== 'active') {
          return NextResponse.json({
            error: `Ticket "${item.ticket_name}" is not available`
          }, { status: 400 })
        }

        if (item.ticket_stock < item.quantity) {
          return NextResponse.json({
            error: `Insufficient stock for "${item.ticket_name}"`,
            available: item.ticket_stock
          }, { status: 400 })
        }

        orderItems.push({
          ticket_id: item.ticket_id,
          ticket_name: item.ticket_name,
          spot_name: item.spot_name,
          price: item.ticket_price,
          quantity: item.quantity,
          cart_item_id: item.cart_item_id
        })
      }
    }

    // 计算总金额
    const totalAmount = orderItems.reduce((sum: number, item: any) => {
      return sum + (item.price * item.quantity)
    }, 0)

    // 生成订单号（格式：年月日+时分秒+6位随机数）
    const now = new Date()
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '')
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0')
    const orderNo = `ORD${dateStr}${timeStr}${random}`

    // 创建订单
    const orderId = randomUUID()

    // 如果是直接预订，保存额外的订单信息
    let orderNote = ''
    if (spot_id && ticket_id) {
      orderNote = `访问日期: ${visitDate}, 访问时间: ${visitTime}, 联系人: ${contactName}, 电话: ${contactPhone}${contactEmail ? ', 邮箱: ' + contactEmail : ''}${remarks ? ', 备注: ' + remarks : ''}`
    }

    dbRun(`
      INSERT INTO orders (id, user_id, order_no, total_amount, status, note, created_at)
      VALUES (?, ?, ?, ?, 'pending', ?, datetime('now'))
    `, [orderId, decoded.userId, orderNo, totalAmount, orderNote])

    // 创建订单项
    for (const item of orderItems) {
      const orderItemId = randomUUID()

      dbRun(`
        INSERT INTO order_items (id, order_id, ticket_id, ticket_name, spot_name, price, quantity, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `, [
        orderItemId,
        orderId,
        item.ticket_id,
        item.ticket_name,
        item.spot_name,
        item.price,
        item.quantity
      ])

      // 扣减库存
      dbRun(`
        UPDATE tickets
        SET stock = stock - ?
        WHERE id = ?
      `, [item.quantity, item.ticket_id])
    }

    // 如果是购物车模式，清空已结算的购物车商品
    if (!spot_id || !ticket_id) {
      if (cart_item_ids && Array.isArray(cart_item_ids) && cart_item_ids.length > 0) {
        const placeholders = cart_item_ids.map(() => '?').join(',')
        dbRun(`DELETE FROM cart_items WHERE user_id = ? AND id IN (${placeholders})`, [decoded.userId, ...cart_item_ids])
      } else {
        // 如果没有指定商品ID，清空所有购物车商品
        dbRun(`DELETE FROM cart_items WHERE user_id = ?`, [decoded.userId])
      }
    }

    // 获取创建的订单详情
    const order = dbGet(`
      SELECT id, order_no, total_amount, status, created_at
      FROM orders
      WHERE id = ?
    `, [orderId])

    return NextResponse.json({
      success: true,
      data: {
        order
      },
      message: 'Order created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
