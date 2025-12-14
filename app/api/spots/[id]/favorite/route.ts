import { NextRequest, NextResponse } from 'next/server'
import { dbGet, dbRun } from '@/lib/db-utils'
import { validateAuth } from '@/lib/auth'

// POST /api/spots/[id]/favorite - 收藏/取消收藏
export async function POST(
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
    const spot = dbGet('SELECT id FROM spots WHERE id = ? AND status = \'active\'', [id])
    if (!spot) {
      return NextResponse.json(
        { success: false, error: '景点不存在' },
        { status: 404 }
      )
    }

    // 检查是否已经收藏
    const existingFavorite = dbGet(
      'SELECT id FROM spot_favorites WHERE spot_id = ? AND user_id = ?',
      [id, user.id]
    )

    let favorited = false

    if (existingFavorite) {
      // 取消收藏
      dbRun('DELETE FROM spot_favorites WHERE spot_id = ? AND user_id = ?', [id, user.id])
      favorited = false
    } else {
      // 收藏
      dbRun('INSERT INTO spot_favorites (spot_id, user_id) VALUES (?, ?)', [id, user.id])
      favorited = true
    }

    // 获取收藏总数
    const { favoriteCount } = dbGet(
      'SELECT COUNT(*) as favoriteCount FROM spot_favorites WHERE spot_id = ?',
      [id]
    )

    return NextResponse.json({
      success: true,
      data: {
        favorited,
        favoriteCount
      },
      message: favorited ? '收藏成功' : '取消收藏成功'
    })
  } catch (error) {
    console.error('Error toggling favorite:', error)
    return NextResponse.json(
      { success: false, error: '操作失败' },
      { status: 500 }
    )
  }
}