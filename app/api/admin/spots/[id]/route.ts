import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getTokenFromRequest } from '@/lib/middleware'
import { dbGet, dbRun, dbQuery } from '@/lib/db-utils'

// PATCH - 更新景点（管理员）
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
    const { name, description, location, price, category_id, is_recommended, images, status } = body

    // 检查景点是否存在
    const spot = dbGet(`
      SELECT id FROM spots WHERE id = ?
    `, [id])

    if (!spot) {
      return NextResponse.json({ error: 'Spot not found' }, { status: 404 })
    }

    // 处理分类ID
    let categoryId = category_id
    if (category_id && !isNaN(category_id)) {
      categoryId = category_id
    } else if (category_id) {
      // 如果传入的是分类名称，获取分类ID
      const category = dbGet(`
        SELECT id FROM spot_categories WHERE name = ?
      `, [category_id])

      if (!category) {
        return NextResponse.json({ error: 'Category not found' }, { status: 404 })
      }
      categoryId = category.id
    }

    // 更新景点
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
    if (price !== undefined) {
      updateFields.push('price = ?')
      updateValues.push(price)
    }
    if (categoryId !== undefined) {
      updateFields.push('category_id = ?')
      updateValues.push(categoryId)
    }
    if (is_recommended !== undefined) {
      updateFields.push('is_recommended = ?')
      updateValues.push(is_recommended ? 1 : 0)
    }
    if (images !== undefined) {
      updateFields.push('images = ?')
      updateValues.push(JSON.stringify(images))
    }
    if (status !== undefined) {
      updateFields.push('status = ?')
      updateValues.push(status)
    }

    updateFields.push('updated_at = datetime(\'now\')')
    updateValues.push(id)

    if (updateFields.length > 1) {
      dbRun(`
        UPDATE spots
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `, updateValues)
    }

    // 获取更新后的景点
    const updatedSpot = dbGet(`
      SELECT s.*, sc.name as category_name
      FROM spots s
      LEFT JOIN spot_categories sc ON s.category_id = sc.id
      WHERE s.id = ?
    `, [id])

    return NextResponse.json({
      success: true,
      spot: updatedSpot,
      message: 'Spot updated successfully'
    })

  } catch (error) {
    console.error('Error updating spot:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - 删除景点（管理员）
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

    // 检查景点是否存在
    const spot = dbGet(`
      SELECT id FROM spots WHERE id = ?
    `, [id])

    if (!spot) {
      return NextResponse.json({ error: 'Spot not found' }, { status: 404 })
    }

    // 检查是否有关联的门票
    const ticketCount = dbGet(`
      SELECT COUNT(*) as count FROM tickets WHERE spot_id = ?
    `, [id])

    if (ticketCount?.count > 0) {
      return NextResponse.json({
        error: 'Cannot delete spot with existing tickets'
      }, { status: 400 })
    }

    // 删除景点
    dbRun(`
      DELETE FROM spots WHERE id = ?
    `, [id])

    return NextResponse.json({
      success: true,
      message: 'Spot deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting spot:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}