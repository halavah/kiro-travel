import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: '邮箱和密码不能为空' },
        { status: 400 }
      )
    }

    const result = await authenticateUser(email, password)

    if (!result) {
      return NextResponse.json(
        { success: false, error: '邮箱或密码错误' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        user: result.user,
        token: result.token
      }
    })
  } catch (error) {
    console.error('登录错误:', error)
    return NextResponse.json(
      { success: false, error: '登录失败' },
      { status: 500 }
    )
  }
}