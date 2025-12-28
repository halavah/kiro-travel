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

    // 酒店预订数量
    const bookingsResult = dbQuery(`
      SELECT COUNT(*) as count
      FROM hotel_bookings
      WHERE user_id = ?
    `, [decoded.userId])
    const bookings = bookingsResult[0]?.count || 0

    // 活动报名数量
    const activitiesResult = dbQuery(`
      SELECT COUNT(*) as count
      FROM activity_participants
      WHERE user_id = ? AND status = 'registered'
    `, [decoded.userId])
    const activities = activitiesResult[0]?.count || 0

    // 收藏数量
    const favoritesResult = dbQuery(`
      SELECT COUNT(*) as count
      FROM spot_favorites
      WHERE user_id = ?
    `, [decoded.userId])
    const favorites = favoritesResult[0]?.count || 0

    // 评论数量
    const commentsResult = dbQuery(`
      SELECT COUNT(*) as count
      FROM spot_comments
      WHERE user_id = ?
    `, [decoded.userId])
    const comments = commentsResult[0]?.count || 0

    return NextResponse.json({
      data: {
        orders,
        bookings,
        activities,
        favorites,
        comments
      }
    })

  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
