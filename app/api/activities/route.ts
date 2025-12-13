import { NextRequest, NextResponse } from 'next/server'
import { dbQuery, paginate, dbRun, dbGet } from '@/lib/db-utils'
import { validateAuth, checkRole } from '@/lib/auth'

// GET /api/activities - 获取活动列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const location = searchParams.get('location') || ''
    const activityType = searchParams.get('activity_type') || ''

    let whereClause = "WHERE status = 'active'"
    const params: any[] = []

    if (search) {
      whereClause += ' AND (name LIKE ? OR description LIKE ?)'
      params.push(`%${search}%`, `%${search}%`)
    }

    if (location) {
      whereClause += ' AND location LIKE ?'
      params.push(`%${location}%`)
    }

    if (activityType) {
      whereClause += ' AND activity_type = ?'
      params.push(activityType)
    }

    const sql = `
      SELECT
        a.*,
        COUNT(DISTINCT ap.id) as participant_count
      FROM activities a
      LEFT JOIN activity_participants ap ON a.id = ap.activity_id AND ap.status = 'confirmed'
      ${whereClause}
      GROUP BY a.id
      ORDER BY a.start_date DESC
    `

    const result = paginate(sql, page, limit, params)

    // 解析 JSON 字段并计算可用名额
    const activitiesWithParsedData = result.data.map((activity: any) => ({
      ...activity,
      images: activity.images ? JSON.parse(activity.images) : [],
      available_slots: activity.max_participants - (activity.current_participants || 0),
      is_full: activity.current_participants >= activity.max_participants
    }))

    return NextResponse.json({
      success: true,
      data: activitiesWithParsedData,
      pagination: result.pagination
    })
  } catch (error) {
    console.error('Error fetching activities:', error)
    return NextResponse.json(
      { success: false, error: '获取活动列表失败' },
      { status: 500 }
    )
  }
}

// POST /api/activities - 创建新活动 (导游/管理员权限)
export async function POST(request: NextRequest) {
  try {
    const user = await validateAuth(request)
    if (!user || !checkRole(user.role, ['admin', 'guide'])) {
      return NextResponse.json(
        { success: false, error: '需要导游或管理员权限' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      name,
      description,
      location,
      images,
      activity_type,
      start_date,
      end_date,
      price,
      max_participants
    } = body

    // 验证必填字段
    if (!name || !location || !start_date || !end_date) {
      return NextResponse.json(
        { success: false, error: '活动名称、位置、开始和结束日期为必填项' },
        { status: 400 }
      )
    }

    const id = `activity_${Date.now()}`
    const imagesJson = JSON.stringify(images || [])

    const sql = `
      INSERT INTO activities (
        id, name, description, location, images, activity_type,
        start_date, end_date, price, max_participants,
        current_participants, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'active')
    `

    dbRun(sql, [
      id, name, description, location, imagesJson, activity_type,
      start_date, end_date, price, max_participants
    ])

    const activity = dbGet('SELECT * FROM activities WHERE id = ?', [id])

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
