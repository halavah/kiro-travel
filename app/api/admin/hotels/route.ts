import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getTokenFromRequest } from '@/lib/middleware'
import { dbQuery, dbGet, dbRun } from '@/lib/db-utils'

// GET - 获取所有酒店（管理员）
export async function GET(req: NextRequest) {
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

    if (!user || (user.role !== 'admin' && user.role !== 'guide')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    // 构建查询条件
    let whereClause = status && status !== 'all' ? "WHERE status = ?" : ""
    const queryParams = status && status !== 'all' ? [status] : []

    // 查询酒店列表
    const hotels = dbQuery(`
      SELECT
        id,
        name,
        description,
        location,
        address,
        rating,
        amenities,
        images,
        phone,
                status,
        created_at
      FROM hotels
      ${whereClause}
      ORDER BY created_at DESC
    `, queryParams)

    // 解析 JSON 字段
    const hotelsWithParsedFields = hotels.map((hotel: any) => ({
      ...hotel,
      amenities: hotel.amenities ? JSON.parse(hotel.amenities) : [],
      images: hotel.images ? JSON.parse(hotel.images) : []
    }))

    return NextResponse.json({ hotels: hotelsWithParsedFields })

  } catch (error) {
    console.error('Error fetching admin hotels:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - 创建酒店（管理员）
export async function POST(req: NextRequest) {
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

    const body = await req.json()
    const {
      name,
      description,
      location,
      address,
      rating,
      amenities,
      images,
      contact_phone,
      status
    } = body

    // 验证必填字段
    if (!name || !location || !rating) {
      return NextResponse.json({
        error: 'Missing required fields: name, location, rating'
      }, { status: 400 })
    }

    // 创建酒店
    const result = dbRun(`
      INSERT INTO hotels (
        name, description, location, address, rating,
        amenities, images, phone, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `, [
      name,
      description || null,
      location,
      address || null,
      parseFloat(rating),
      JSON.stringify(amenities || []),
      JSON.stringify(images || []),
      contact_phone || null,
      status || 'active'
    ])

    const hotelId = result.lastInsertRowid

    // 获取创建的酒店
    const hotel = dbGet(`
      SELECT * FROM hotels WHERE id = ?
    `, [hotelId])

    // 解析 JSON 字段
    const hotelWithParsedFields = {
      ...hotel,
      amenities: hotel?.amenities ? JSON.parse(hotel.amenities) : [],
      images: hotel?.images ? JSON.parse(hotel.images) : []
    }

    return NextResponse.json({
      success: true,
      hotel: hotelWithParsedFields,
      message: 'Hotel created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating hotel:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}