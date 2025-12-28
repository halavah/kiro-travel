import { NextRequest, NextResponse } from 'next/server'
import { dbGet, dbRun } from '@/lib/db-utils'
import { validateAuth, checkRole } from '@/lib/auth'

// GET /api/news/[id] - 获取新闻详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const news = dbGet(`
      SELECT n.*, nc.name as category_name, p.full_name as author_name
      FROM news n
      LEFT JOIN news_categories nc ON n.category_id = nc.id
      LEFT JOIN profiles p ON n.author_id = p.id
      WHERE n.id = ?
    `, [id])

    if (!news) {
      return NextResponse.json(
        { success: false, error: '新闻不存在' },
        { status: 404 }
      )
    }

    // 增加浏览量
    dbRun(`UPDATE news SET view_count = view_count + 1 WHERE id = ?`, [id])

    return NextResponse.json({
      success: true,
      data: news
    })
  } catch (error) {
    console.error('Error fetching news details:', error)
    return NextResponse.json(
      { success: false, error: '获取新闻详情失败' },
      { status: 500 }
    )
  }
}

// PUT /api/news/[id] - 更新新闻
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await validateAuth(request)

    if (!user) {
      return NextResponse.json(
        { success: false, error: error || '请先登录' },
        { status: 401 }
      )
    }

    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: '只有管理员可以编辑新闻' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { title, content, summary, cover_image, category_id, is_published } = body

    console.log('[News Update] Request received:', {
      id,
      id_type: typeof id,
      title,
      content_length: content?.length,
      summary,
      cover_image,
      category_id,
      is_published,
      is_published_type: typeof is_published
    })

    // 验证必填字段
    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: '标题和内容为必填项' },
        { status: 400 }
      )
    }

    // 如果状态变为已发布，更新发布时间
    console.log('[News Update] Checking if news exists with id:', id)
    const currentNews = dbGet(`SELECT is_published FROM news WHERE id = ?`, [id]) as any
    console.log('[News Update] Current news from DB:', currentNews)

    if (!currentNews) {
      console.error('[News Update] News not found in database with id:', id)
      return NextResponse.json(
        { success: false, error: '新闻不存在', details: `未找到ID为 ${id} 的新闻` },
        { status: 404 }
      )
    }

    const publishedAt = (!currentNews?.is_published && is_published)
      ? new Date().toISOString()
      : undefined

    let sql = `
      UPDATE news
      SET title = ?, content = ?, summary = ?, cover_image = ?,
          category_id = ?, is_published = ?, updated_at = CURRENT_TIMESTAMP
    `
    // Ensure is_published is explicitly converted to 0 or 1
    const publishedValue = is_published === true || is_published === 1 || is_published === '1' ? 1 : 0

    const sqlParams: any[] = [
      title,
      content,
      summary || null,
      cover_image || null,
      category_id || null,
      publishedValue
    ]

    console.log('[News Update] SQL Params:', sqlParams)

    if (publishedAt) {
      sql += `, published_at = ?`
      sqlParams.push(publishedAt)
    }

    sql += ` WHERE id = ?`
    sqlParams.push(id)

    console.log('[News Update] Final SQL:', sql)
    console.log('[News Update] Final Params:', sqlParams)

    try {
      const result = dbRun(sql, sqlParams)
      console.log('[News Update] DB Result:', result)
    } catch (dbError) {
      console.error('[News Update] DB Error:', dbError)
      throw dbError
    }

    const updatedNews = dbGet(`
      SELECT n.*, nc.name as category_name, p.full_name as author_name
      FROM news n
      LEFT JOIN news_categories nc ON n.category_id = nc.id
      LEFT JOIN profiles p ON n.author_id = p.id
      WHERE n.id = ?
    `, [id])

    return NextResponse.json({
      success: true,
      data: updatedNews,
      message: '新闻更新成功'
    })
  } catch (error) {
    console.error('Error updating news:', error)
    return NextResponse.json(
      {
        success: false,
        error: '更新新闻失败',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

// DELETE /api/news/[id] - 删除新闻
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await validateAuth(request)

    if (!user) {
      return NextResponse.json(
        { success: false, error: error || '请先登录' },
        { status: 401 }
      )
    }

    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: '只有管理员可以删除新闻' },
        { status: 403 }
      )
    }

    const { id } = await params

    dbRun(`DELETE FROM news WHERE id = ?`, [id])

    return NextResponse.json({
      success: true,
      message: '新闻删除成功'
    })
  } catch (error) {
    console.error('Error deleting news:', error)
    return NextResponse.json(
      { success: false, error: '删除新闻失败' },
      { status: 500 }
    )
  }
}
