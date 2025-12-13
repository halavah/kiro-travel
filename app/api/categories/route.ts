import { NextRequest, NextResponse } from 'next/server'
import { dbQuery, dbRun } from '@/lib/db-utils'
import { validateAuth, checkRole } from '@/lib/auth'

// GET /api/categories - 获取所有分类
export async function GET() {
  try {
    const categories = dbQuery(`
      SELECT
        c.*,
        COUNT(s.id) as spot_count
      FROM spot_categories c
      LEFT JOIN spots s ON c.id = s.category_id AND s.status = 'active'
      GROUP BY c.id
      ORDER BY c.sort_order, c.name
    `)

    return NextResponse.json({
      success: true,
      data: categories
    })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { success: false, error: '获取分类失败' },
      { status: 500 }
    )
  }
}

// POST /api/categories - 创建新分类
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await validateAuth(request)

    if (!user) {
      return NextResponse.json(
        { success: false, error: error || '请先登录' },
        { status: 401 }
      )
    }

    // 检查权限
    if (!checkRole(user.role, 'admin')) {
      return NextResponse.json(
        { success: false, error: '权限不足' },
        { status: 403 }
      )
    }

    const { name, description, icon, color, sort_order } = await request.json()

    if (!name) {
      return NextResponse.json(
        { success: false, error: '分类名称不能为空' },
        { status: 400 }
      )
    }

    // 检查分类是否已存在
    const existingCategory = dbQuery(
      'SELECT id FROM spot_categories WHERE name = ?',
      [name]
    )

    if (existingCategory.length > 0) {
      return NextResponse.json(
        { success: false, error: '分类已存在' },
        { status: 400 }
      )
    }

    // 获取最大排序值
    const { maxOrder } = dbQuery(
      'SELECT MAX(sort_order) as maxOrder FROM spot_categories'
    )[0] || { maxOrder: 0 }

    const { lastInsertRowid } = dbRun(`
      INSERT INTO spot_categories (name, description, icon, color, sort_order)
      VALUES (?, ?, ?, ?, ?)
    `, [
      name,
      description || '',
      icon || '',
      color || '#3B82F6',
      sort_order || (maxOrder + 1)
    ])

    // 获取创建的分类
    const category = dbQuery(
      'SELECT * FROM spot_categories WHERE id = ?',
      [lastInsertRowid]
    )[0]

    return NextResponse.json({
      success: true,
      data: category,
      message: '分类创建成功'
    })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json(
      { success: false, error: '创建分类失败' },
      { status: 500 }
    )
  }
}