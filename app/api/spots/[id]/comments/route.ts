import { NextRequest, NextResponse } from 'next/server'
import { dbQuery, dbGet, dbRun } from '@/lib/db-utils'
import { validateAuth } from '@/lib/auth'

// GET /api/spots/[id]/comments - 获取景点评论
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    // 检查景点是否存在
    const spot = dbGet('SELECT id FROM spots WHERE id = ? AND status = \'active\'', [id])
    if (!spot) {
      return NextResponse.json(
        { success: false, error: '景点不存在' },
        { status: 404 }
      )
    }

    const offset = (page - 1) * limit
    const comments = dbQuery(`
      SELECT
        c.*,
        p.full_name as nickname,
        p.avatar_url as avatar
      FROM spot_comments c
      LEFT JOIN profiles p ON c.user_id = p.id
      WHERE c.spot_id = ?
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `, [id, limit, offset])

    // 获取总数
    const { total } = dbGet(
      'SELECT COUNT(*) as total FROM spot_comments WHERE spot_id = ?',
      [id]
    )

    return NextResponse.json({
      success: true,
      data: comments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { success: false, error: '获取评论失败' },
      { status: 500 }
    )
  }
}

// POST /api/spots/[id]/comments - 添加评论
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
    const { content, rating } = await request.json()

    if (!content || !rating) {
      return NextResponse.json(
        { success: false, error: '评论内容和评分不能为空' },
        { status: 400 }
      )
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: '评分必须在1-5之间' },
        { status: 400 }
      )
    }

    // 检查景点是否存在
    const spot = dbGet('SELECT id FROM spots WHERE id = ? AND status = \'active\'', [id])
    if (!spot) {
      return NextResponse.json(
        { success: false, error: '景点不存在' },
        { status: 404 }
      )
    }

    // 添加评论
    const { lastInsertRowid } = dbRun(`
      INSERT INTO spot_comments (spot_id, user_id, content, rating)
      VALUES (?, ?, ?, ?)
    `, [id, user.id, content, rating])

    // 获取评论详情
    const comment = dbGet(`
      SELECT
        c.*,
        p.full_name as nickname,
        p.avatar_url as avatar
      FROM spot_comments c
      LEFT JOIN profiles p ON c.user_id = p.id
      WHERE c.id = ?
    `, [lastInsertRowid])

    return NextResponse.json({
      success: true,
      data: comment,
      message: '评论添加成功'
    })
  } catch (error) {
    console.error('Error adding comment:', error)
    return NextResponse.json(
      { success: false, error: '添加评论失败' },
      { status: 500 }
    )
  }
}