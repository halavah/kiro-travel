import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { dbQuery, dbGet } from '@/lib/db-utils'
import { getTokenFromRequest } from '@/lib/middleware'

// GET - 获取所有订单（管理员）
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

    if (!user || (user.role !== 'admin' && user.role !== 'guide')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    // 构建查询条件
    let whereClauses = ['1=1']
    let queryParams: any[] = []

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
        p.full_name,
        p.email,
        COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN profiles p ON o.user_id = p.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE ${whereClause}
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `, queryParams)

    return NextResponse.json({ orders })

  } catch (error) {
    console.error('Error fetching admin orders:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}