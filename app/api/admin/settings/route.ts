import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getTokenFromRequest } from '@/lib/middleware'
import { dbGet } from '@/lib/db-utils'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

// 设置文件路径
const SETTINGS_FILE = join(process.cwd(), 'data', 'settings.json')

// 默认设置
const DEFAULT_SETTINGS = {
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

// 读取设置
function loadSettings() {
  try {
    if (existsSync(SETTINGS_FILE)) {
      const data = readFileSync(SETTINGS_FILE, 'utf-8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Error loading settings:', error)
  }
  return DEFAULT_SETTINGS
}

// 保存设置
function saveSettings(settings: any) {
  try {
    const dir = join(process.cwd(), 'data')
    if (!existsSync(dir)) {
      const { mkdirSync } = require('fs')
      mkdirSync(dir, { recursive: true })
    }
    writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8')
    return true
  } catch (error) {
    console.error('Error saving settings:', error)
    return false
  }
}

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

    // 从文件加载设置
    const settings = loadSettings()

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

    // 保存设置到文件
    const saved = saveSettings(settings)

    if (!saved) {
      return NextResponse.json({
        success: false,
        error: 'Failed to save settings'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Settings saved successfully'
    })

  } catch (error) {
    console.error('Error saving settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}