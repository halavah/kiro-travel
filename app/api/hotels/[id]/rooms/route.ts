import { NextRequest, NextResponse } from 'next/server'
import { dbQuery, dbRun, dbGet } from '@/lib/db-utils'
import { validateAuth, checkRole } from '@/lib/auth'

// GET /api/hotels/[id]/rooms - 获取酒店的所有房间
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const available = searchParams.get('available') === 'true'

    let whereClause = 'WHERE hotel_id = ? AND status = ?'
    const queryParams: any[] = [id, 'available']

    const sql = `
      SELECT *
      FROM hotel_rooms
      ${whereClause}
      ORDER BY price_per_night ASC
    `

    const rooms = dbQuery(sql, queryParams)

    // 解析 JSON 字段
    const roomsWithParsedData = rooms.map((room: any) => ({
      ...room,
      images: room.images ? JSON.parse(room.images) : [],
      amenities: room.amenities ? JSON.parse(room.amenities) : []
    }))

    return NextResponse.json({
      success: true,
      data: roomsWithParsedData
    })
  } catch (error) {
    console.error('Error fetching hotel rooms:', error)
    return NextResponse.json(
      { success: false, error: '获取房间列表失败' },
      { status: 500 }
    )
  }
}

// POST /api/hotels/[id]/rooms - 为酒店添加新房间 (管理员权限)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await validateAuth(request)
    if (!user || !checkRole(user.role, ['admin'])) {
      return NextResponse.json(
        { success: false, error: '需要管理员权限' },
        { status: 403 }
      )
    }

    // 验证酒店是否存在
    const hotel = dbGet('SELECT id FROM hotels WHERE id = ?', [id])
    if (!hotel) {
      return NextResponse.json(
        { success: false, error: '酒店不存在' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const {
      name,
      type,
      description,
      price_per_night,
      max_occupancy,
      images,
      amenities
    } = body

    // 验证必填字段
    if (!name || !type || !price_per_night || !max_occupancy) {
      return NextResponse.json(
        { success: false, error: '房间名称、类型、价格和最大入住人数为必填项' },
        { status: 400 }
      )
    }

    const imagesJson = JSON.stringify(images || [])
    const amenitiesJson = JSON.stringify(amenities || [])

    const sql = `
      INSERT INTO hotel_rooms (
        hotel_id, name, type, max_occupancy, price_per_night,
        images, amenities, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'available')
    `

    const result = dbRun(sql, [
      id, name, type, max_occupancy, price_per_night,
      imagesJson, amenitiesJson
    ])

    const roomId = result.lastInsertRowid
    const room = dbGet('SELECT * FROM hotel_rooms WHERE id = ?', [roomId])

    return NextResponse.json({
      success: true,
      data: {
        ...room,
        images: JSON.parse((room as any).images || '[]'),
        amenities: JSON.parse((room as any).amenities || '[]')
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating hotel room:', error)
    return NextResponse.json(
      { success: false, error: '创建房间失败' },
      { status: 500 }
    )
  }
}
