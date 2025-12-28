import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getTokenFromRequest } from '@/lib/middleware'
import { dbGet, dbRun } from '@/lib/db-utils'

// PATCH - 更新用户信息（管理员）
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = getTokenFromRequest(req)

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // 检查用户是否是管理员
    const admin = dbGet(`
      SELECT role FROM profiles WHERE id = ?
    `, [decoded.userId])

    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()
    const { role } = body
    // TODO: status 字段需要先在数据库 profiles 表中添加
    // const { role, status } = body

    // 检查目标用户是否存在
    const user = dbGet(`
      SELECT id, role FROM profiles WHERE id = ?
    `, [id])

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 防止修改超级管理员的角色
    if (id === decoded.userId && role && role !== 'admin') {
      return NextResponse.json({
        error: 'Cannot change your own admin role'
      }, { status: 400 })
    }

    // 更新用户信息
    const updateFields = []
    const updateValues = []

    if (role !== undefined) {
      updateFields.push('role = ?')
      updateValues.push(role)
    }

    // TODO: 恢复 status 更新功能需要先在数据库添加 status 字段
    // if (status !== undefined) {
    //   updateFields.push('status = ?')
    //   updateValues.push(status)
    // }

    updateFields.push('updated_at = datetime(\'now\')')
    updateValues.push(id)

    if (updateFields.length > 1) {
      dbRun(`
        UPDATE profiles
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `, updateValues)
    }

    return NextResponse.json({
      success: true,
      message: 'User updated successfully'
    })

  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}