import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { dbGet, dbRun } from '@/lib/db-utils'

// POST - 报名参加活动
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { id } = await params

    // 检查活动是否存在且状态为 active
    const activity = dbGet(`
      SELECT id, title, max_participants, status
      FROM activities
      WHERE id = ? AND status = 'active'
    `, [id])

    if (!activity) {
      return NextResponse.json({ error: '活动不存在或已关闭' }, { status: 404 })
    }

    // 检查是否已经报名
    const existingParticipant = dbGet(`
      SELECT id FROM activity_participants
      WHERE activity_id = ? AND user_id = ? AND status = 'registered'
    `, [id, decoded.userId])

    if (existingParticipant) {
      return NextResponse.json({ error: '您已经报名过该活动' }, { status: 400 })
    }

    // 检查活动是否已满员
    if (activity.max_participants) {
      const participantCount = dbGet(`
        SELECT COUNT(*) as count
        FROM activity_participants
        WHERE activity_id = ? AND status = 'registered'
      `, [id])

      if (participantCount.count >= activity.max_participants) {
        return NextResponse.json({ error: '活动报名人数已满' }, { status: 400 })
      }
    }

    // 添加报名记录
    const result = dbRun(`
      INSERT INTO activity_participants (activity_id, user_id, status)
      VALUES (?, ?, 'registered')
    `, [id, decoded.userId])

    return NextResponse.json({
      success: true,
      data: {
        id: result.lastInsertRowid,
        message: '报名成功'
      }
    })

  } catch (error) {
    console.error('Error joining activity:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - 取消报名
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { id } = await params

    // 检查是否已经报名
    const participant = dbGet(`
      SELECT id FROM activity_participants
      WHERE activity_id = ? AND user_id = ? AND status = 'registered'
    `, [id, decoded.userId])

    if (!participant) {
      return NextResponse.json({ error: '您尚未报名该活动' }, { status: 400 })
    }

    // 更新报名状态为取消
    dbRun(`
      UPDATE activity_participants
      SET status = 'cancelled'
      WHERE activity_id = ? AND user_id = ?
    `, [id, decoded.userId])

    return NextResponse.json({
      success: true,
      message: '取消报名成功'
    })

  } catch (error) {
    console.error('Error cancelling activity participation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
