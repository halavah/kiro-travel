import { NextRequest, NextResponse } from 'next/server'
import { dbQuery, paginate, dbRun, dbGet } from '@/lib/db-utils'
import { validateAuth, checkRole } from '@/lib/auth'

// GET /api/hotels - 获取酒店列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const location = searchParams.get('location') || ''
    // TODO: 价格过滤需要数据库添加 price_min 和 price_max 字段
    // const minPrice = searchParams.get('min_price') || ''
    // const maxPrice = searchParams.get('max_price') || ''
    const starRating = searchParams.get('star_rating') || ''

    let whereClause = "WHERE h.status = 'active'"
    const params: any[] = []

    if (search) {
      whereClause += ' AND (h.name LIKE ? OR h.description LIKE ?)'
      params.push(`%${search}%`, `%${search}%`)
    }

    if (location) {
      whereClause += ' AND h.location LIKE ?'
      params.push(`%${location}%`)
    }

    // TODO: 恢复价格过滤功能需要先在数据库添加字段
    // if (minPrice) {
    //   whereClause += ' AND h.price_min >= ?'
    //   params.push(parseFloat(minPrice))
    // }
    //
    // if (maxPrice) {
    //   whereClause += ' AND h.price_max <= ?'
    //   params.push(parseFloat(maxPrice))
    // }

    if (starRating) {
      whereClause += ' AND h.star_rating = ?'
      params.push(parseInt(starRating))
    }

    const sql = `
      SELECT
        h.*,
        COUNT(DISTINCT hr.id) as room_count
      FROM hotels h
      LEFT JOIN hotel_rooms hr ON h.id = hr.hotel_id AND hr.status = 'active'
      ${whereClause}
      GROUP BY h.id
      ORDER BY h.created_at DESC
    `

    const result = paginate(sql, page, limit, params)

    // 解析 JSON 字段
    const hotelsWithParsedData = result.data.map((hotel: any) => ({
      ...hotel,
      images: hotel.images ? JSON.parse(hotel.images) : [],
      amenities: hotel.amenities ? JSON.parse(hotel.amenities) : []
    }))

    return NextResponse.json({
      success: true,
      data: hotelsWithParsedData,
      pagination: result.pagination
    })
  } catch (error) {
    console.error('Error fetching hotels:', error)
    return NextResponse.json(
      { success: false, error: '获取酒店列表失败' },
      { status: 500 }
    )
  }
}

// POST /api/hotels - 创建新酒店 (管理员权限)
export async function POST(request: NextRequest) {
  try {
    const user = await validateAuth(request)
    if (!user || !checkRole(user.role, ['admin'])) {
      return NextResponse.json(
        { success: false, error: '需要管理员权限' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      name,
      description,
      address,
      location,
      images,
      star_rating,
      price_min,
      price_max,
      amenities,
      contact_phone
    } = body

    // 验证必填字段
    if (!name || !location) {
      return NextResponse.json(
        { success: false, error: '酒店名称和位置为必填项' },
        { status: 400 }
      )
    }

    const imagesJson = JSON.stringify(images || [])
    const amenitiesJson = JSON.stringify(amenities || [])

    const sql = `
      INSERT INTO hotels (
        name, description, address, location, images,
        star_rating, price_min, price_max, amenities, contact_phone, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `

    const result = dbRun(sql, [
      name, description, address, location, imagesJson,
      star_rating, price_min, price_max, amenitiesJson, contact_phone
    ])

    const hotelId = result.lastInsertRowid
    const hotel = dbGet('SELECT * FROM hotels WHERE id = ?', [hotelId])

    return NextResponse.json({
      success: true,
      data: {
        ...hotel,
        images: JSON.parse((hotel as any).images || '[]'),
        amenities: JSON.parse((hotel as any).amenities || '[]')
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating hotel:', error)
    return NextResponse.json(
      { success: false, error: '创建酒店失败' },
      { status: 500 }
    )
  }
}
