import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { dbQuery } from '@/lib/db-utils'

// GET - 获取所有活动报名（管理员）
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 获取查询参数
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const activityId = searchParams.get('activity_id')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // 构建查询条件
    let whereClause = '1=1'
    const params: any[] = []

    if (status && status !== 'all') {
      whereClause += ' AND p.status = ?'
      params.push(status)
    }

    if (activityId) {
      whereClause += ' AND p.activity_id = ?'
      params.push(activityId)
    }

    // 获取总数
    const countQuery = `
      SELECT COUNT(*) as total
      FROM activity_participants p
      WHERE ${whereClause}
    `
    const countResult = dbQuery(countQuery, params)
    const total = countResult[0]?.total || 0

    // 获取报名列表
    const participantsQuery = `
      SELECT
        p.id,
        p.activity_id,
        p.user_id,
        p.status,
        p.created_at,
        a.title as activity_name,
        a.location,
        a.start_time,
        a.end_time,
        a.price,
        a.max_participants,
        a.images as activity_images,
        u.email as user_email,
        u.full_name as user_name
      FROM activity_participants p
      LEFT JOIN activities a ON p.activity_id = a.id
      LEFT JOIN profiles u ON p.user_id = u.id
      WHERE ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `
    params.push(limit, offset)
    const participants = dbQuery(participantsQuery, params)

    // 解析 JSON 字段
    const participantsWithImages = participants.map((participant: any) => ({
      ...participant,
      activity_images: participant.activity_images ? JSON.parse(participant.activity_images) : []
    }))

    // 获取活动统计
    const statsQuery = `
      SELECT
        a.id,
        a.title,
        a.max_participants,
        COUNT(CASE WHEN p.status = 'registered' THEN 1 END) as registered_count,
        COUNT(CASE WHEN p.status = 'cancelled' THEN 1 END) as cancelled_count
      FROM activities a
      LEFT JOIN activity_participants p ON a.id = p.activity_id
      GROUP BY a.id
      ORDER BY registered_count DESC
    `
    const stats = dbQuery(statsQuery, [])

    return NextResponse.json({
      success: true,
      data: {
        participants: participantsWithImages,
        stats,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      }
    })

  } catch (error) {
    console.error('Error fetching participants:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
