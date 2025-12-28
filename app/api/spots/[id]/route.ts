import { NextRequest, NextResponse } from 'next/server'
import { dbQuery, dbGet, dbRun, dbTransaction } from '@/lib/db-utils'
import { validateAuth } from '@/lib/auth'

// GET /api/spots/[id] - 获取景点详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // 获取景点基本信息
    const spot = dbGet(`
      SELECT
        s.*,
        sc.name as category_name,
        COUNT(DISTINCT sl.id) as like_count,
        COUNT(DISTINCT sf.id) as favorite_count,
        IFNULL(AVG(sco.rating), 0) as average_rating,
        COUNT(DISTINCT sco.id) as comment_count
      FROM spots s
      LEFT JOIN spot_categories sc ON s.category_id = sc.id
      LEFT JOIN spot_likes sl ON s.id = sl.spot_id
      LEFT JOIN spot_favorites sf ON s.id = sf.spot_id
      LEFT JOIN spot_comments sco ON s.id = sco.spot_id
      WHERE s.id = ? AND s.status = 'active'
      GROUP BY s.id
    `, [id])

    if (!spot) {
      return NextResponse.json(
        { success: false, error: '景点不存在' },
        { status: 404 }
      )
    }

    // 获取评论列表
    const comments = dbQuery(`
      SELECT
        c.*,
        p.full_name,
        p.avatar_url
      FROM spot_comments c
      LEFT JOIN profiles p ON c.user_id = p.id
      WHERE c.spot_id = ?
      ORDER BY c.created_at DESC
      LIMIT 10
    `, [id])

    // 解析 images 字段
    const spotImages = JSON.parse(spot.images || '[]')

    return NextResponse.json({
      success: true,
      data: {
        ...spot,
        images: spotImages,
        comments
      }
    })
  } catch (error) {
    console.error('Error fetching spot details:', error)
    return NextResponse.json(
      { success: false, error: '获取景点详情失败' },
      { status: 500 }
    )
  }
}

// PUT /api/spots/[id] - 更新景点
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await validateAuth(request)

    if (!user) {
      return NextResponse.json(
        { success: false, error: '请先登录' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()

    // 检查景点是否存在
    const spot = dbGet('SELECT * FROM spots WHERE id = ?', [id])
    if (!spot) {
      return NextResponse.json(
        { success: false, error: '景点不存在' },
        { status: 404 }
      )
    }

    // 检查权限（仅管理员可以修改）
    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: '权限不足' },
        { status: 403 }
      )
    }

    // 更新景点
    const { name, description, category_id, location, price, images, status } = body
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
    if (category_id !== undefined) {
      updateFields.push('category_id = ?')
      updateValues.push(category_id)
    }
    if (location !== undefined) {
      updateFields.push('location = ?')
      updateValues.push(location)
    }
    if (price !== undefined) {
      updateFields.push('price = ?')
      updateValues.push(price)
    }
    if (images !== undefined) {
      updateFields.push('images = ?')
      updateValues.push(JSON.stringify(images))
    }
    if (status !== undefined) {
      updateFields.push('status = ?')
      updateValues.push(status)
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { success: false, error: '没有要更新的字段' },
        { status: 400 }
      )
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP')
    updateValues.push(id)

    const sql = `UPDATE spots SET ${updateFields.join(', ')} WHERE id = ?`
    dbRun(sql, updateValues)

    // 获取更新后的景点信息
    const updatedSpot = dbGet(`
      SELECT s.*, sc.name as category_name
      FROM spots s
      LEFT JOIN spot_categories sc ON s.category_id = sc.id
      WHERE s.id = ?
    `, [id])

    return NextResponse.json({
      success: true,
      data: updatedSpot,
      message: '景点更新成功'
    })
  } catch (error) {
    console.error('Error updating spot:', error)
    return NextResponse.json(
      { success: false, error: '更新景点失败' },
      { status: 500 }
    )
  }
}

// DELETE /api/spots/[id] - 删除景点
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await validateAuth(request)

    if (!user) {
      return NextResponse.json(
        { success: false, error: '请先登录' },
        { status: 401 }
      )
    }

    const { id } = await params

    // 检查景点是否存在
    const spot = dbGet('SELECT * FROM spots WHERE id = ?', [id])
    if (!spot) {
      return NextResponse.json(
        { success: false, error: '景点不存在' },
        { status: 404 }
      )
    }

    // 检查权限（仅管理员可以修改）
    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: '权限不足' },
        { status: 403 }
      )
    }

    // 软删除：更新状态
    dbRun('UPDATE spots SET status = \'inactive\' WHERE id = ?', [id])

    return NextResponse.json({
      success: true,
      message: '景点删除成功'
    })
  } catch (error) {
    console.error('Error deleting spot:', error)
    return NextResponse.json(
      { success: false, error: '删除景点失败' },
      { status: 500 }
    )
  }
}