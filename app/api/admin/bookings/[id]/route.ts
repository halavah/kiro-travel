import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { dbGet, dbRun } from '@/lib/db-utils'

// PATCH - 更新预订状态（管理员）
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()
    const { status } = body

    // 验证状态值
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed']
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: '无效的状态值' }, { status: 400 })
    }

    // 检查预订是否存在
    const booking = dbGet(`
      SELECT id, status FROM hotel_bookings WHERE id = ?
    `, [id])

    if (!booking) {
      return NextResponse.json({ error: '预订不存在' }, { status: 404 })
    }

    // 更新状态
    dbRun(`
      UPDATE hotel_bookings
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [status, id])

    return NextResponse.json({
      success: true,
      message: '预订状态已更新'
    })

  } catch (error) {
    console.error('Error updating booking:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
