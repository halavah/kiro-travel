import { NextRequest, NextResponse } from 'next/server'
import { dbQuery, paginate, dbRun, dbGet, normalizeJsonArrayField } from '@/lib/db-utils'
import { validateAuth, checkRole } from '@/lib/auth'

// GET /api/activities - 获取活动列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const location = searchParams.get('location') || ''
    // TODO: 活动类型过滤需要数据库添加 activity_type 字段
    // const activityType = searchParams.get('activity_type') || ''
    const isActive = searchParams.get('is_active')

    let whereClause = "WHERE 1=1"
    const params: any[] = []

    // 如果指定 is_active=true，只显示活跃的活动
    if (isActive === 'true') {
      whereClause += " AND a.status = 'active'"
    } else if (isActive === 'false') {
      whereClause += " AND a.status = 'inactive'"
    }
    // 如果没有指定 is_active，显示所有状态的活动

    if (search) {
      whereClause += ' AND (a.title LIKE ? OR a.description LIKE ?)'
      params.push(`%${search}%`, `%${search}%`)
    }

    if (location) {
      whereClause += ' AND a.location LIKE ?'
      params.push(`%${location}%`)
    }

    // TODO: 恢复活动类型过滤功能需要先在数据库添加 activity_type 字段
    // if (activityType) {
    //   whereClause += ' AND a.activity_type = ?'
    //   params.push(activityType)
    // }

    const sql = `
      SELECT
        a.*,
        COUNT(DISTINCT ap.id) as participant_count
      FROM activities a
      LEFT JOIN activity_participants ap ON a.id = ap.activity_id AND ap.status = 'registered'
      ${whereClause}
      GROUP BY a.id
      ORDER BY a.start_time DESC
    `

    const result = paginate(sql, page, limit, params)

    // 解析 JSON 字段并计算可用名额
    const activitiesWithParsedData = result.data.map((activity: any) => ({
      ...activity,
      images: activity.images ? JSON.parse(activity.images) : [],
      available_slots: activity.max_participants ? activity.max_participants - (activity.participant_count || 0) : null,
      is_full: activity.max_participants ? activity.participant_count >= activity.max_participants : false
    }))

    return NextResponse.json({
      success: true,
      data: activitiesWithParsedData,
      pagination: result.pagination
    })
  } catch (error) {
    console.error('Error fetching activities:', error)
    // 返回更详细的错误信息（仅在开发环境）
    const isDev = process.env.NODE_ENV !== 'production'
    return NextResponse.json(
      {
        success: false,
        error: '获取活动列表失败',
        ...(isDev && { details: error instanceof Error ? error.message : String(error) })
      },
      { status: 500 }
    )
  }
}

// POST /api/activities - 创建新活动 (导游/管理员权限)
export async function POST(request: NextRequest) {
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
        { success: false, error: '需要导游或管理员权限' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      title,
      description,
      location,
      images,
      activity_type,
      start_time,
      end_time,
      price,
      max_participants
    } = body

    // 验证必填字段
    if (!title || !location || !start_time || !end_time) {
      return NextResponse.json(
        { success: false, error: '活动名称、位置、开始和结束时间为必填项' },
        { status: 400 }
      )
    }

    // 规范化 images 字段
    const normalizedImages = normalizeJsonArrayField(images)

    const sql = `
      INSERT INTO activities (
        title, description, location, images, activity_type,
        start_time, end_time, price, max_participants, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `

    const result = dbRun(sql, [
      title, description, location, normalizedImages, activity_type,
      start_time, end_time, price, max_participants
    ])

    const activityId = result.lastInsertRowid
    const activity = dbGet('SELECT * FROM activities WHERE id = ?', [activityId])

    return NextResponse.json({
      success: true,
      data: {
        ...activity,
        images: JSON.parse((activity as any).images || '[]')
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating activity:', error)
    return NextResponse.json(
      { success: false, error: '创建活动失败' },
      { status: 500 }
    )
  }
}
