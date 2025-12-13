import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getTokenFromRequest } from '@/lib/middleware'
import { dbGet, dbRun, dbQuery } from '@/lib/db-utils'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'
import { execSync } from 'child_process'

// GET - 获取系统设置（管理员）
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

    // 检查用户是否是管理员
    const user = dbGet(`
      SELECT role FROM profiles WHERE id = ?
    `, [decoded.userId])

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 这里可以从数据库或配置文件中获取设置
    // 目前返回默认设置
    const settings = {
      site: {
        name: '畅游天下',
        description: '您的旅行好帮手',
        logoUrl: '',
        contactEmail: 'support@changyou.com',
        contactPhone: '400-123-4567',
        address: '北京市朝阳区xxx大厦'
      },
      features: {
        enableRegistration: true,
        enableComments: true,
        enableFavorites: true,
        requireEmailVerification: false
      },
      notifications: {
        newOrderEmail: true,
        newRegistrationEmail: true,
        lowStockAlert: true,
        adminEmail: 'admin@changyou.com'
      },
      backup: {
        autoBackup: true,
        backupFrequency: 'daily',
        lastBackup: '',
        backupPath: '/backups'
      }
    }

    return NextResponse.json({ settings })

  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - 保存系统设置（管理员）
export async function POST(req: NextRequest) {
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
    const user = dbGet(`
      SELECT role FROM profiles WHERE id = ?
    `, [decoded.userId])

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const settings = await req.json()

    // 这里可以将设置保存到数据库或配置文件中
    // 目前只是返回成功

    return NextResponse.json({
      success: true,
      message: 'Settings saved successfully'
    })

  } catch (error) {
    console.error('Error saving settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}