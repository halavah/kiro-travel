import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getTokenFromRequest } from '@/lib/middleware'
import { dbGet, dbRun } from '@/lib/db-utils'

// PATCH - 更新酒店（管理员）
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
    const {
      name,
      description,
      location,
      address,
      rating,
      // TODO: price_range 和 contact_email 字段需要先在数据库添加
      // price_range,
      amenities,  // 数据库字段名是 amenities，不是 facilities
      images,
      contact_phone,
      // contact_email,
      status
    } = body

    // 检查酒店是否存在
    const hotel = dbGet(`
      SELECT id FROM hotels WHERE id = ?
    `, [id])

    if (!hotel) {
      return NextResponse.json({ error: 'Hotel not found' }, { status: 404 })
    }

    // 更新酒店
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
    if (location !== undefined) {
      updateFields.push('location = ?')
      updateValues.push(location)
    }
    if (address !== undefined) {
      updateFields.push('address = ?')
      updateValues.push(address)
    }
    if (rating !== undefined) {
      updateFields.push('rating = ?')
      updateValues.push(parseFloat(rating))
    }
    // TODO: 恢复 price_range 更新功能需要先在数据库添加字段
    // if (price_range !== undefined) {
    //   updateFields.push('price_range = ?')
    //   updateValues.push(price_range)
    // }
    if (amenities !== undefined) {
      updateFields.push('amenities = ?')
      updateValues.push(JSON.stringify(amenities))
    }
    if (images !== undefined) {
      updateFields.push('images = ?')
      updateValues.push(JSON.stringify(images))
    }
    if (contact_phone !== undefined) {
      updateFields.push('phone = ?')  // 数据库字段名是 phone
      updateValues.push(contact_phone)
    }
    // TODO: 恢复 contact_email 更新功能需要先在数据库添加字段
    // if (contact_email !== undefined) {
    //   updateFields.push('contact_email = ?')
    //   updateValues.push(contact_email)
    // }
    if (status !== undefined) {
      updateFields.push('status = ?')
      updateValues.push(status)
    }

    updateFields.push('updated_at = datetime(\'now\')')
    updateValues.push(id)

    if (updateFields.length > 1) {
      dbRun(`
        UPDATE hotels
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `, updateValues)
    }

    // 获取更新后的酒店
    const updatedHotel = dbGet(`
      SELECT * FROM hotels WHERE id = ?
    `, [id])

    // 解析 JSON 字段
    const hotelWithParsedFields = {
      ...updatedHotel,
      amenities: updatedHotel?.amenities ? JSON.parse(updatedHotel.amenities) : [],
      images: updatedHotel?.images ? JSON.parse(updatedHotel.images) : []
    }

    return NextResponse.json({
      success: true,
      hotel: hotelWithParsedFields,
      message: 'Hotel updated successfully'
    })

  } catch (error) {
    console.error('Error updating hotel:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - 删除酒店（管理员）
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

    // 检查酒店是否存在
    const hotel = dbGet(`
      SELECT id FROM hotels WHERE id = ?
    `, [id])

    if (!hotel) {
      return NextResponse.json({ error: 'Hotel not found' }, { status: 404 })
    }

    // 删除酒店
    dbRun(`
      DELETE FROM hotels WHERE id = ?
    `, [id])

    return NextResponse.json({
      success: true,
      message: 'Hotel deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting hotel:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}