import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getTokenFromRequest } from '@/lib/middleware'
import { dbQuery, dbGet } from '@/lib/db-utils'

// GET - 获取所有用户（管理员）
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
    const role = searchParams.get('role')

    // 构建查询条件
    let whereClauses = ['1=1']
    let queryParams: any[] = []

    if (role && role !== 'all') {
      whereClauses.push('p.role = ?')
      queryParams.push(role)
    }

    const whereClause = whereClauses.join(' AND ')

    // 查询用户列表
    const users = dbQuery(`
      SELECT
        p.id,
        p.email,
        p.full_name,
        p.avatar_url,
        p.role,
        p.created_at,
        COUNT(DISTINCT o.id) as order_count,
        COALESCE(SUM(o.total_amount), 0) as total_spent
      FROM profiles p
      LEFT JOIN orders o ON p.id = o.user_id
      WHERE ${whereClause}
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `, queryParams)

    return NextResponse.json({ users })

  } catch (error) {
    console.error('Error fetching admin users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}