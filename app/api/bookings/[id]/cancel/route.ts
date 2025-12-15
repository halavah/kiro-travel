import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { dbGet, dbRun } from '@/lib/db-utils'

// POST - 取消预订
// 推荐使用此端点进行预订取消操作（符合 REST 规范）
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

    // 检查预订是否存在且属于当前用户
    const booking = dbGet(`
      SELECT id, user_id, status
      FROM hotel_bookings
      WHERE id = ?
    `, [id])

    if (!booking) {
      return NextResponse.json({ error: '预订不存在' }, { status: 404 })
    }

    if (booking.user_id !== decoded.userId) {
      return NextResponse.json({ error: '无权操作此预订' }, { status: 403 })
    }

    if (booking.status === 'cancelled') {
      return NextResponse.json({ error: '预订已取消' }, { status: 400 })
    }

    if (booking.status === 'completed') {
      return NextResponse.json({ error: '已完成的预订无法取消' }, { status: 400 })
    }

    // 更新预订状态为已取消
    dbRun(`
      UPDATE hotel_bookings
      SET status = 'cancelled', updated_at = datetime('now')
      WHERE id = ?
    `, [id])

    return NextResponse.json({
      success: true,
      message: '预订已取消'
    })

  } catch (error) {
    console.error('Error cancelling booking:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
