import { NextRequest, NextResponse } from 'next/server'
import { dbQuery, dbGet, dbRun } from '@/lib/db-utils'
import { validateAuth, checkRole } from '@/lib/auth'

// GET /api/admin/activities - 获取所有活动（管理员）
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await validateAuth(request)

    if (!user) {
      return NextResponse.json(
        { success: false, error: error || '请先登录' },
        { status: 401 }
      )
    }

    if (!checkRole(user.role, 'guide')) {
      return NextResponse.json(
        { success: false, error: '权限不足' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let whereClause = 'WHERE 1=1'
    const params: any[] = []

    if (status && status !== 'all') {
      whereClause += ' AND status = ?'
      params.push(status)
    }

    const sql = `
      SELECT
        a.*,
        COUNT(DISTINCT ap.id) as participant_count
      FROM activities a
      LEFT JOIN activity_participants ap ON a.id = ap.activity_id
      ${whereClause}
      GROUP BY a.id
      ORDER BY a.created_at DESC
    `

    const activities = dbQuery(sql, params)

    // 解析 JSON 字段
    const activitiesWithParsedData = activities.map((activity: any) => ({
      ...activity,
      images: activity.images ? JSON.parse(activity.images) : []
    }))

    return NextResponse.json({
      success: true,
      data: activitiesWithParsedData
    })
  } catch (error) {
    console.error('Error fetching activities:', error)
    return NextResponse.json(
      { success: false, error: '获取活动列表失败' },
      { status: 500 }
    )
  }
}
