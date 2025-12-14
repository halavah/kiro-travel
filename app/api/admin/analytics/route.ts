import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getTokenFromRequest } from '@/lib/middleware'
import { dbQuery, dbGet } from '@/lib/db-utils'

// GET - 获取数据分析（管理员）
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

    // 检查用户是否是管理员
    const user = dbGet(`
      SELECT role FROM profiles WHERE id = ?
    `, [decoded.userId])

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const timeRange = searchParams.get('timeRange') || '7d'

    // 计算时间范围
    let days = 7
    if (timeRange === '30d') days = 30
    else if (timeRange === '90d') days = 90
    else if (timeRange === '1y') days = 365

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    const startDateStr = startDate.toISOString().split('T')[0]

    // 1. 获取概览数据
    const totalUsers = dbGet(`
      SELECT COUNT(*) as count FROM profiles
    `)?.count || 0

    const totalOrders = dbGet(`
      SELECT COUNT(*) as count FROM orders
    `)?.count || 0

    const totalRevenue = dbGet(`
      SELECT COALESCE(SUM(total_amount), 0) as total FROM orders
      WHERE status IN ('paid', 'completed')
    `)?.total || 0

    const totalSpots = dbGet(`
      SELECT COUNT(*) as count FROM spots
    `)?.count || 0

    const totalHotels = dbGet(`
      SELECT COUNT(*) as count FROM hotels
    `)?.count || 0

    // 计算增长率（与上一个周期对比）
    const prevStartDate = new Date()
    prevStartDate.setDate(prevStartDate.getDate() - days * 2)
    const prevStartDateStr = prevStartDate.toISOString().split('T')[0]

    const prevUsers = dbGet(`
      SELECT COUNT(*) as count FROM profiles
      WHERE created_at < ?
    `, [startDateStr])?.count || 0

    const prevOrders = dbGet(`
      SELECT COUNT(*) as count FROM orders
      WHERE created_at < ?
    `, [startDateStr])?.count || 0

    const prevRevenue = dbGet(`
      SELECT COALESCE(SUM(total_amount), 0) as total FROM orders
      WHERE status IN ('paid', 'completed') AND created_at < ?
    `, [startDateStr])?.total || 0

    const growthRates = {
      users: prevUsers > 0 ? ((totalUsers - prevUsers) / prevUsers * 100) : 0,
      orders: prevOrders > 0 ? ((totalOrders - prevOrders) / prevOrders * 100) : 0,
      revenue: prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue * 100) : 0
    }

    // 2. 获取销售趋势数据
    const salesData = dbQuery(`
      SELECT
        DATE(created_at) as date,
        COUNT(DISTINCT user_id) as users,
        COUNT(*) as orders,
        COALESCE(SUM(total_amount), 0) as revenue
      FROM orders
      WHERE created_at >= ?
      GROUP BY DATE(created_at)
      ORDER BY date
    `, [startDateStr])

    // 3. 获取热门景点
    const topSpots = dbQuery(`
      SELECT
        s.name,
        COUNT(DISTINCT o.id) as orders,
        COALESCE(SUM(oi.price * oi.quantity), 0) as revenue,
        s.rating
      FROM spots s
      INNER JOIN tickets t ON s.id = t.spot_id
      INNER JOIN order_items oi ON t.id = oi.ticket_id
      INNER JOIN orders o ON oi.order_id = o.id
      WHERE o.status IN ('paid', 'completed') AND o.created_at >= ?
      GROUP BY s.id
      HAVING orders > 0
      ORDER BY orders DESC
      LIMIT 10
    `, [startDateStr])

    // 4. 获取热门门票
    const topTickets = dbQuery(`
      SELECT
        t.name,
        s.name as spot_name,
        SUM(oi.quantity) as sold,
        SUM(oi.price * oi.quantity) as revenue
      FROM tickets t
      INNER JOIN spots s ON t.spot_id = s.id
      INNER JOIN order_items oi ON t.id = oi.ticket_id
      INNER JOIN orders o ON oi.order_id = o.id
      WHERE o.status IN ('paid', 'completed') AND o.created_at >= ?
      GROUP BY t.id
      HAVING sold > 0
      ORDER BY sold DESC
      LIMIT 10
    `, [startDateStr])

    // 5. 获取用户角色分布
    const userStats = dbQuery(`
      SELECT
        CASE
          WHEN role = 'admin' THEN '管理员'
          WHEN role = 'guide' THEN '导游'
          ELSE '普通用户'
        END as role,
        COUNT(*) as count
      FROM profiles
      GROUP BY role
      ORDER BY count DESC
    `)

    const totalUserCount = userStats.reduce((sum: number, stat: any) => sum + stat.count, 0)
    const userStatsWithPercentage = userStats.map((stat: any) => ({
      ...stat,
      percentage: totalUserCount > 0 ? (stat.count / totalUserCount * 100).toFixed(1) : 0
    }))

    // 6. 获取订单状态分布
    const orderStatus = dbQuery(`
      SELECT
        CASE
          WHEN status = 'pending' THEN '待支付'
          WHEN status = 'paid' THEN '已支付'
          WHEN status = 'cancelled' THEN '已取消'
          WHEN status = 'completed' THEN '已完成'
        END as status,
        COUNT(*) as count
      FROM orders
      GROUP BY status
      ORDER BY count DESC
    `)

    const totalOrderCount = orderStatus.reduce((sum: number, stat: any) => sum + stat.count, 0)
    const orderStatusWithPercentage = orderStatus.map((stat: any) => ({
      ...stat,
      percentage: totalOrderCount > 0 ? (stat.count / totalOrderCount * 100).toFixed(1) : 0
    }))

    return NextResponse.json({
      overview: {
        totalUsers,
        totalOrders,
        totalRevenue,
        totalSpots,
        totalHotels,
        growthRates
      },
      salesData,
      topSpots,
      topTickets,
      userStats: userStatsWithPercentage,
      orderStatus: orderStatusWithPercentage
    })

  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}