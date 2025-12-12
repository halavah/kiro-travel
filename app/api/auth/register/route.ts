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

    return NextResponse.json({
      success: true,
      data: {
        user: result.user,
        token: result.token
      },
      message: '注册成功'
    })
  } catch (error: any) {
    console.error('注册错误:', error)
    return NextResponse.json(
      { success: false, error: error.message || '注册失败' },
      { status: 400 }
    )
  }
}