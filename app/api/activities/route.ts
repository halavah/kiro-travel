import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/activities - 获取活动列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const isActive = searchParams.get('is_active') === 'true'

    let whereClauses: string[] = ['is_active = 1']
    const queryParams: any[] = []

    if (isActive) {
      whereClauses.push('is_active = 1')
    }

    const whereClause = whereClauses.join(' AND ')
    const params = [...queryParams]

    // 查询总数
    const countStmt = db.prepare(`
      SELECT COUNT(*) as total
      FROM activities
      WHERE ${whereClause}
    `)
    const { total } = countStmt.get(...params) as { total: number }

    // 查询数据
    const offset = (page - 1) * limit
    const stmt = db.prepare(`
      SELECT
        id,
        name,
        description,
        location,
        images,
        activity_type,
        start_date,
        end_date,
        price,
        max_participants,
        is_active,
        created_at,
        updated_at
      FROM activities
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `)

    const activities = stmt.all(...params, limit, offset)

    // 解析 JSON 字段
    const formattedActivities = activities.map((activity: any) => ({
      ...activity,
      images: activity.images ? JSON.parse(activity.images) : [],
      is_active: activity.is_active === 1,
    }))

    return NextResponse.json({
      success: true,
      data: formattedActivities,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('获取活动列表失败:', error)
    return NextResponse.json(
      { success: false, error: '获取活动列表失败' },
      { status: 500 }
    )
  }
}
