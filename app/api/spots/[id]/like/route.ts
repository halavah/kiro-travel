import { NextRequest, NextResponse } from 'next/server'
import { dbGet, dbRun, dbTransaction } from '@/lib/db-utils'
import { validateAuth } from '@/lib/auth'

// POST /api/spots/[id]/like - 点赞/取消点赞
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

    // 检查是否已经点赞
    const existingLike = dbGet(
      'SELECT id FROM spot_likes WHERE spot_id = ? AND user_id = ?',
      [id, user.id]
    )

    let liked = false

    if (existingLike) {
      // 取消点赞
      dbRun('DELETE FROM spot_likes WHERE spot_id = ? AND user_id = ?', [id, user.id])
      liked = false
    } else {
      // 点赞
      dbRun('INSERT INTO spot_likes (spot_id, user_id) VALUES (?, ?)', [id, user.id])
      liked = true
    }

    // 获取点赞总数
    const { likeCount } = dbGet(
      'SELECT COUNT(*) as likeCount FROM spot_likes WHERE spot_id = ?',
      [id]
    )

    return NextResponse.json({
      success: true,
      data: {
        liked,
        likeCount
      },
      message: liked ? '点赞成功' : '取消点赞成功'
    })
  } catch (error) {
    console.error('Error toggling like:', error)
    return NextResponse.json(
      { success: false, error: '操作失败' },
      { status: 500 }
    )
  }
}