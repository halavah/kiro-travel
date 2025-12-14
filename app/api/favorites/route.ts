import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { dbQuery, dbGet, dbRun } from '@/lib/db-utils'

// GET - 获取用户收藏列表
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

    // 查询用户的收藏列表，关联景点信息
    const favorites = dbQuery(`
      SELECT
        sf.id as favorite_id,
        sf.created_at,
        s.id as spot_id,
        s.name as spot_name,
        s.location,
        s.description,
        s.images,
        s.rating,
        s.price,
        c.name as category_name
      FROM spot_favorites sf
      LEFT JOIN spots s ON sf.spot_id = s.id
      LEFT JOIN spot_categories c ON s.category_id = c.id
      WHERE sf.user_id = ?
      ORDER BY sf.created_at DESC
    `, [decoded.userId])

    // 解析 JSON 字段
    const items = favorites.map((item: any) => ({
      ...item,
      images: item.images ? JSON.parse(item.images) : []
    }))

    return NextResponse.json({
      favorites: items,
      count: items.length
    })

  } catch (error) {
    console.error('Error fetching favorites:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - 添加收藏
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

    const body = await req.json()
    const { spot_id } = body

    if (!spot_id) {
      return NextResponse.json({ error: 'spot_id is required' }, { status: 400 })
    }

    // 检查景点是否存在
    const spot = dbGet(`SELECT id FROM spots WHERE id = ?`, [spot_id])
    if (!spot) {
      return NextResponse.json({ error: 'Spot not found' }, { status: 404 })
    }

    // 检查是否已收藏
    const existing = dbGet(`
      SELECT id FROM spot_favorites
      WHERE spot_id = ? AND user_id = ?
    `, [spot_id, decoded.userId])

    if (existing) {
      return NextResponse.json({
        error: 'Already favorited',
        favorite_id: existing.id
      }, { status: 400 })
    }

    // 添加收藏
    dbRun(`
      INSERT INTO spot_favorites (spot_id, user_id)
      VALUES (?, ?)
    `, [spot_id, decoded.userId])

    // 获取刚插入的 ID
    const newFavorite = dbGet(`
      SELECT id FROM spot_favorites
      WHERE spot_id = ? AND user_id = ?
    `, [spot_id, decoded.userId])

    return NextResponse.json({
      success: true,
      message: 'Added to favorites',
      favorite_id: newFavorite.id
    }, { status: 201 })

  } catch (error) {
    console.error('Error adding favorite:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - 取消收藏（通过 spot_id）
export async function DELETE(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const spot_id = searchParams.get('spot_id')

    if (!spot_id) {
      return NextResponse.json({ error: 'spot_id is required' }, { status: 400 })
    }

    // 删除收藏
    dbRun(`
      DELETE FROM spot_favorites
      WHERE spot_id = ? AND user_id = ?
    `, [spot_id, decoded.userId])

    return NextResponse.json({
      success: true,
      message: 'Removed from favorites'
    })

  } catch (error) {
    console.error('Error removing favorite:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
