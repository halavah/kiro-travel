import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { dbQuery } from '@/lib/db-utils'

// GET - 获取所有酒店预订（管理员）
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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // 构建查询条件
    let whereClause = '1=1'
    const params: any[] = []

    if (status && status !== 'all') {
      whereClause += ' AND b.status = ?'
      params.push(status)
    }

    // 获取总数
    const countQuery = `
      SELECT COUNT(*) as total
      FROM hotel_bookings b
      WHERE ${whereClause}
    `
    const countResult = dbQuery(countQuery, params)
    const total = countResult[0]?.total || 0

    // 获取预订列表
    const bookingsQuery = `
      SELECT
        b.id,
        b.user_id,
        b.room_id,
        b.hotel_name,
        b.room_name,
        b.check_in,
        b.check_out,
        b.guests,
        b.total_price,
        b.status,
        b.created_at,
        b.updated_at,
        p.email as user_email,
        p.full_name as user_name,
        r.images as room_images
      FROM hotel_bookings b
      LEFT JOIN profiles p ON b.user_id = p.id
      LEFT JOIN hotel_rooms r ON b.room_id = r.id
      WHERE ${whereClause}
      ORDER BY b.created_at DESC
      LIMIT ? OFFSET ?
    `
    params.push(limit, offset)
    const bookings = dbQuery(bookingsQuery, params)

    // 解析 JSON 字段
    const bookingsWithImages = bookings.map((booking: any) => ({
      ...booking,
      room_images: booking.room_images ? JSON.parse(booking.room_images) : []
    }))

    return NextResponse.json({
      success: true,
      data: {
        bookings: bookingsWithImages,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      }
    })

  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
