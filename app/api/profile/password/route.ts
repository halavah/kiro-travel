import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { dbGet, dbRun } from '@/lib/db-utils'
import bcrypt from 'bcryptjs'

// POST - 修改密码
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

    const { newPassword } = await req.json()

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // 更新密码
    dbRun(`
      UPDATE profiles
      SET password_hash = ?, updated_at = datetime('now')
      WHERE id = ?
    `, [hashedPassword, decoded.userId])

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully'
    })

  } catch (error) {
    console.error('Error updating password:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
