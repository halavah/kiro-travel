import { NextRequest, NextResponse } from 'next/server'
import { dbGet, dbRun, normalizeJsonArrayField } from '@/lib/db-utils'
import { validateAuth, checkRole } from '@/lib/auth'

// GET /api/activities/[id] - 获取活动详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const activity = dbGet(`SELECT * FROM activities WHERE id = ?`, [id])

    if (!activity) {
      return NextResponse.json(
        { success: false, error: '活动不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        ...activity,
        images: JSON.parse((activity as any).images || '[]')
      }
    })
  } catch (error) {
    console.error('Error fetching activity details:', error)
    return NextResponse.json(
      { success: false, error: '获取活动详情失败' },
      { status: 500 }
    )
  }
}

// PUT /api/activities/[id] - 更新活动
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const body = await request.json()
    const { title, description, location, start_time, end_time, max_participants, price, images, status } = body

    console.log('[Activity Update] Request body:', {
      id,
      title,
      images_raw: images,
      images_type: typeof images,
      status
    })

    // 验证必填字段
    if (!title || !location || !start_time || !end_time) {
      return NextResponse.json(
        { success: false, error: '标题、地点、开始时间和结束时间为必填项' },
        { status: 400 }
      )
    }

    // 规范化 images 字段
    const normalizedImages = normalizeJsonArrayField(images)
    console.log('[Activity Update] Normalized images:', normalizedImages)

    const sql = `
      UPDATE activities
      SET title = ?, description = ?, location = ?, start_time = ?, end_time = ?,
          max_participants = ?, price = ?, images = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `

    const sqlParams = [
      title,
      description || null,
      location,
      start_time,
      end_time,
      max_participants || 0,
      price || 0,
      normalizedImages,
      status || 'active',
      id
    ]

    console.log('[Activity Update] SQL Params:', sqlParams)

    try {
      const result = dbRun(sql, sqlParams)
      console.log('[Activity Update] DB Result:', result)

      if (result.changes === 0) {
        return NextResponse.json(
          { success: false, error: '活动不存在或未发生变更' },
          { status: 404 }
        )
      }
    } catch (dbError) {
      console.error('[Activity Update] DB Error:', dbError)
      throw dbError
    }

    const updatedActivity = dbGet(`SELECT * FROM activities WHERE id = ?`, [id])

    return NextResponse.json({
      success: true,
      data: {
        ...updatedActivity,
        images: JSON.parse((updatedActivity as any).images || '[]')
      },
      message: '活动更新成功'
    })
  } catch (error) {
    console.error('Error updating activity:', error)
    return NextResponse.json(
      {
        success: false,
        error: '更新活动失败',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

// DELETE /api/activities/[id] - 删除活动
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await validateAuth(request)

    if (!user) {
      return NextResponse.json(
        { success: false, error: error || '请先登录' },
        { status: 401 }
      )
    }

    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: '只有管理员可以删除活动' },
        { status: 403 }
      )
    }

    const { id } = await params

    dbRun(`DELETE FROM activity_participants WHERE activity_id = ?`, [id])
    dbRun(`DELETE FROM activities WHERE id = ?`, [id])

    return NextResponse.json({
      success: true,
      message: '活动删除成功'
    })
  } catch (error) {
    console.error('Error deleting activity:', error)
    return NextResponse.json(
      { success: false, error: '删除活动失败' },
      { status: 500 }
    )
  }
}
