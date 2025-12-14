import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromRequest } from '@/lib/middleware'
import { dbQuery } from '@/lib/db-utils'
import { verifyToken } from '@/lib/auth'

// GET - 获取用户统计数据
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

    // 获取订单数量
    const ordersResult = dbQuery(`
      SELECT COUNT(*) as count
      FROM orders
      WHERE user_id = ?
    `, [decoded.userId])
    const orders = ordersResult[0]?.count || 0

    // 酒店预订数量（hotel_bookings表不存在，暂时返回0）
    const bookings = 0

    // 收藏数量（spot_favorites表不存在，暂时返回0）
    const favorites = 0

    // 评论数量（spot_comments表不存在，暂时返回0）
    const comments = 0

    return NextResponse.json({
      data: {
        orders,
        bookings,
        favorites,
        comments
      }
    })

  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
