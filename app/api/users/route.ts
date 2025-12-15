import { NextRequest, NextResponse } from 'next/server'
import { query, get, run } from '@/lib/sqlite'
import bcrypt from 'bcryptjs'
import { validateAuth } from '@/lib/auth'

// GET /api/users - 获取用户列表
export async function GET(request: NextRequest) {
  try {
    // 验证管理员权限
    const { user, error } = await validateAuth(request)

    if (!user) {
      return NextResponse.json(
        { success: false, error: error || '请先登录' },
        { status: 401 }
      )
    }

    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: '需要管理员权限' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')

    let sql = 'SELECT id, email, full_name, role, avatar_url, created_at FROM profiles'
    const params: any[] = []

    if (role) {
      sql += ' WHERE role = ?'
      params.push(role)
    }

    sql += ' ORDER BY created_at DESC'

    const users = await query(sql, params)

    return NextResponse.json({
      success: true,
      data: users
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

// POST /api/users - 创建新用户
export async function POST(request: NextRequest) {
  try {
    // 验证管理员权限
    const { user, error } = await validateAuth(request)

    if (!user) {
      return NextResponse.json(
        { success: false, error: error || '请先登录' },
        { status: 401 }
      )
    }

    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: '需要管理员权限' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { email, password, full_name, role = 'user' } = body

    if (!email || !password || !full_name) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await get('SELECT id FROM profiles WHERE email = ?', [email])
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'User already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    const sql = `
      INSERT INTO profiles (email, password_hash, full_name, role)
      VALUES (?, ?, ?, ?)
    `
    const { lastID } = await run(sql, [email, hashedPassword, full_name, role])

    // Return user without password
    const newUser = await get(
      'SELECT id, email, full_name, role, avatar_url, created_at FROM profiles WHERE id = ?',
      [lastID]
    )

    return NextResponse.json({
      success: true,
      data: newUser
    })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create user' },
      { status: 500 }
    )
  }
}