import { NextRequest, NextResponse } from 'next/server'
import { dbGet, dbRun } from '@/lib/db-utils'
import { validateAuth, checkRole } from '@/lib/auth'

// GET /api/activities/[id] - 获取活动详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id

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
  { params }: { params: { id: string } }
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

    const id = params.id
    const body = await request.json()
    const { title, description, location, start_time, end_time, max_participants, price, images, status } = body

    const sql = `
      UPDATE activities
      SET title = ?, description = ?, location = ?, start_time = ?, end_time = ?,
          max_participants = ?, price = ?, images = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `

    dbRun(sql, [
      title,
      description,
      location,
      start_time,
      end_time,
      max_participants,
      price,
      JSON.stringify(images || []),
      status || 'active',
      id
    ])

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
      { success: false, error: '更新活动失败' },
      { status: 500 }
    )
  }
}

// DELETE /api/activities/[id] - 删除活动
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const id = params.id

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
