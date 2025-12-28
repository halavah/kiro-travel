import { NextRequest, NextResponse } from 'next/server'
import { dbGet, dbRun } from '@/lib/db-utils'
import { validateAuth, checkRole } from '@/lib/auth'

// GET /api/hotels/[id] - 获取酒店详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const hotel = dbGet(`
      SELECT h.*, COUNT(DISTINCT hr.id) as room_count
      FROM hotels h
      LEFT JOIN hotel_rooms hr ON h.id = hr.hotel_id AND hr.status = 'active'
      WHERE h.id = ?
      GROUP BY h.id
    `, [id])

    if (!hotel) {
      return NextResponse.json(
        { success: false, error: '酒店不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        ...hotel,
        images: JSON.parse((hotel as any).images || '[]'),
        amenities: JSON.parse((hotel as any).amenities || '[]')
      }
    })
  } catch (error) {
    console.error('Error fetching hotel:', error)
    return NextResponse.json(
      { success: false, error: '获取酒店详情失败' },
      { status: 500 }
    )
  }
}

// PUT /api/hotels/[id] - 更新酒店信息 (管理员权限)
export async function PUT(
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
      contact_phone,
      status
    } = body

    const imagesJson = images ? JSON.stringify(images) : undefined
    const amenitiesJson = amenities ? JSON.stringify(amenities) : undefined

    let updateFields: string[] = []
    let updateValues: any[] = []

    if (name !== undefined) {
      updateFields.push('name = ?')
      updateValues.push(name)
    }
    if (description !== undefined) {
      updateFields.push('description = ?')
      updateValues.push(description)
    }
    if (address !== undefined) {
      updateFields.push('address = ?')
      updateValues.push(address)
    }
    if (location !== undefined) {
      updateFields.push('location = ?')
      updateValues.push(location)
    }
    if (imagesJson !== undefined) {
      updateFields.push('images = ?')
      updateValues.push(imagesJson)
    }
    if (star_rating !== undefined) {
      updateFields.push('star_rating = ?')
      updateValues.push(star_rating)
    }
    if (price_min !== undefined) {
      updateFields.push('price_min = ?')
      updateValues.push(price_min)
    }
    if (price_max !== undefined) {
      updateFields.push('price_max = ?')
      updateValues.push(price_max)
    }
    if (amenitiesJson !== undefined) {
      updateFields.push('amenities = ?')
      updateValues.push(amenitiesJson)
    }
    if (contact_phone !== undefined) {
      updateFields.push('contact_phone = ?')
      updateValues.push(contact_phone)
    }
    if (status !== undefined) {
      updateFields.push('status = ?')
      updateValues.push(status)
    }

    updateFields.push('updated_at = datetime("now")')
    updateValues.push(id)

    const sql = `
      UPDATE hotels
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `

    dbRun(sql, updateValues)

    const updatedHotel = dbGet('SELECT * FROM hotels WHERE id = ?', [id])

    return NextResponse.json({
      success: true,
      data: {
        ...updatedHotel,
        images: JSON.parse((updatedHotel as any).images || '[]'),
        amenities: JSON.parse((updatedHotel as any).amenities || '[]')
      }
    })
  } catch (error) {
    console.error('Error updating hotel:', error)
    return NextResponse.json(
      { success: false, error: '更新酒店失败' },
      { status: 500 }
    )
  }
}

// DELETE /api/hotels/[id] - 删除酒店 (管理员权限)
export async function DELETE(
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

    // 软删除：将状态设置为 inactive
    dbRun('UPDATE hotels SET status = ?, updated_at = datetime("now") WHERE id = ?',
      ['inactive', id])

    return NextResponse.json({
      success: true,
      message: '酒店已删除'
    })
  } catch (error) {
    console.error('Error deleting hotel:', error)
    return NextResponse.json(
      { success: false, error: '删除酒店失败' },
      { status: 500 }
    )
  }
}
