import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getTokenFromRequest } from '@/lib/middleware'
import { dbGet, dbRun, dbQuery } from '@/lib/db-utils'

// PATCH - 更新门票（管理员）
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = getTokenFromRequest(req)

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // 检查用户是否是管理员或导游
    const user = dbGet(`
      SELECT role FROM profiles WHERE id = ?
    `, [decoded.userId])

    if (!user || (user.role !== 'admin' && user.role !== 'guide')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()
    const { name, description, price, stock, spot_id, valid_from, valid_to, status } = body

    // 检查门票是否存在
    const ticket = dbGet(`
      SELECT id FROM tickets WHERE id = ?
    `, [id])

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // 如果要更改景点，检查新景点是否存在
    if (spot_id) {
      const spot = dbGet(`
        SELECT id FROM spots WHERE id = ?
      `, [spot_id])

      if (!spot) {
        return NextResponse.json({ error: 'Spot not found' }, { status: 404 })
      }
    }

    // 更新门票
    const updateFields = []
    const updateValues = []

    if (name !== undefined) {
      updateFields.push('name = ?')
      updateValues.push(name)
    }
    if (description !== undefined) {
      updateFields.push('description = ?')
      updateValues.push(description)
    }
    if (price !== undefined) {
      updateFields.push('price = ?')
      updateValues.push(price)
    }
    if (stock !== undefined) {
      updateFields.push('stock = ?')
      updateValues.push(stock)
    }
    if (spot_id !== undefined) {
      updateFields.push('spot_id = ?')
      updateValues.push(spot_id)
    }
    if (valid_from !== undefined) {
      updateFields.push('valid_from = ?')
      updateValues.push(valid_from)
    }
    if (valid_to !== undefined) {
      updateFields.push('valid_to = ?')
      updateValues.push(valid_to)
    }
    if (status !== undefined) {
      updateFields.push('status = ?')
      updateValues.push(status)
    }

    updateFields.push('updated_at = datetime(\'now\')')
    updateValues.push(id)

    if (updateFields.length > 1) {
      dbRun(`
        UPDATE tickets
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `, updateValues)
    }

    // 获取更新后的门票
    const updatedTicket = dbGet(`
      SELECT t.*, s.name as spot_name, s.location as spot_location
      FROM tickets t
      LEFT JOIN spots s ON t.spot_id = s.id
      WHERE t.id = ?
    `, [id])

    return NextResponse.json({
      success: true,
      ticket: updatedTicket,
      message: 'Ticket updated successfully'
    })

  } catch (error) {
    console.error('Error updating ticket:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - 删除门票（管理员）
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = getTokenFromRequest(req)

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // 检查用户是否是管理员
    const user = dbGet(`
      SELECT role FROM profiles WHERE id = ?
    `, [decoded.userId])

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    // 检查门票是否存在
    const ticket = dbGet(`
      SELECT id FROM tickets WHERE id = ?
    `, [id])

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // 检查是否有已售出的订单
    const soldCount = dbGet(`
      SELECT COUNT(*) as count FROM order_items WHERE ticket_id = ?
    `, [id])

    if (soldCount?.count > 0) {
      return NextResponse.json({
        error: 'Cannot delete ticket with existing orders'
      }, { status: 400 })
    }

    // 删除门票
    dbRun(`
      DELETE FROM tickets WHERE id = ?
    `, [id])

    return NextResponse.json({
      success: true,
      message: 'Ticket deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting ticket:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}