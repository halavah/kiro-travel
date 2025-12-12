import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { dbQuery, dbRun } from '@/lib/db-utils'

// GET - 获取用户的预订列表
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // 获取用户的预订列表
    const bookings = dbQuery(`
      SELECT
        id,
        room_id,
        hotel_name,
        room_name,
        check_in,
        check_out,
        guests,
        total_price,
        status,
        created_at
      FROM hotel_bookings
      WHERE user_id = ?
      ORDER BY created_at DESC
    `, [decoded.userId])

    return NextResponse.json({ data: bookings })

  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - 创建新预订
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { room_id, hotel_name, room_name, check_in, check_out, guests, total_price, status } = await req.json()

    // 验证必填字段
    if (!room_id || !hotel_name || !room_name || !check_in || !check_out || !guests || !total_price) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 创建预订
    const result = dbRun(`
      INSERT INTO hotel_bookings (
        user_id, room_id, hotel_name, room_name,
        check_in, check_out, guests, total_price, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [decoded.userId, room_id, hotel_name, room_name, check_in, check_out, guests, total_price, status || 'pending'])

    return NextResponse.json({
      success: true,
      data: {
        id: result.lastInsertRowid,
        message: 'Booking created successfully'
      }
    })

  } catch (error) {
    console.error('Error creating booking:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
