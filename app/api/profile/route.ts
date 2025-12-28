import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromRequest } from '@/lib/middleware'
import { dbGet, dbRun } from '@/lib/db-utils'
import { verifyToken } from '@/lib/auth'
import bcrypt from 'bcryptjs'

// GET - 获取用户资料
export async function GET(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req)

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // 获取用户资料
    const user = dbGet(`
      SELECT id, email, full_name as nickname, avatar_url as avatar, role, created_at
      FROM profiles
      WHERE id = ?
    `, [decoded.userId])

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      data: user
    })

  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH - 更新用户资料
export async function PATCH(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req)

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { nickname, avatar } = await req.json()

    // 更新用户资料
    dbRun(`
      UPDATE profiles
      SET full_name = ?, avatar_url = ?, updated_at = datetime('now')
      WHERE id = ?
    `, [nickname || null, avatar || null, decoded.userId])

    // 获取更新后的用户资料
    const user = dbGet(`
      SELECT id, email, full_name as nickname, avatar_url as avatar, role, created_at
      FROM profiles
      WHERE id = ?
    `, [decoded.userId])

    return NextResponse.json({
      success: true,
      data: user,
      message: 'Profile updated successfully'
    })

  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
