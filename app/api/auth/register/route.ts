import { NextRequest, NextResponse } from 'next/server'
import { registerUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password, full_name, role } = await request.json()

    if (!email || !password || !full_name) {
      return NextResponse.json(
        { success: false, error: '邮箱、密码和姓名不能为空' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: '密码长度至少为6位' },
        { status: 400 }
      )
    }

    const result = await registerUser({ email, password, full_name, role })

    // 创建响应并设置 httpOnly cookie
    const response = NextResponse.json({
      success: true,
      data: {
        user: result.user,
        token: result.token
      },
      message: '注册成功'
    })

    // 设置 httpOnly cookie，7天过期
    response.cookies.set('token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    })

    return response
  } catch (error: any) {
    console.error('注册错误:', error)
    return NextResponse.json(
      { success: false, error: error.message || '注册失败' },
      { status: 400 }
    )
  }
}