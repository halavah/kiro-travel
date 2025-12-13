import { NextRequest, NextResponse } from 'next/server'
import { dbQuery } from '@/lib/db-utils'

// GET - 获取指定景点的门票列表
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const spotId = params.id

    // 验证景点是否存在
    const spot = dbQuery(`
      SELECT id, name FROM spots WHERE id = ? AND status = 'active'
    `, [spotId])

    if (!spot || spot.length === 0) {
      return NextResponse.json({ error: '景点不存在或已下架' }, { status: 404 })
    }

    // 获取该景点的门票列表
    const tickets = dbQuery(`
      SELECT
        t.id,
        t.name,
        t.description,
        t.price,
        t.stock,
        t.valid_from,
        t.valid_to,
        t.status,
        s.name as spot_name,
        s.location
      FROM tickets t
      JOIN spots s ON t.spot_id = s.id
      WHERE t.spot_id = ? AND t.status = 'active'
      ORDER BY t.price ASC
    `, [spotId])

    // 检查门票有效期
    const now = new Date()
    const validTickets = tickets.filter((ticket: any) => {
      if (!ticket.valid_from || !ticket.valid_to) return true
      const validFrom = new Date(ticket.valid_from)
      const validTo = new Date(ticket.valid_to)
      return now >= validFrom && now <= validTo
    })

    return NextResponse.json({
      tickets: validTickets
    })

  } catch (error) {
    console.error('Error fetching spot tickets:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}