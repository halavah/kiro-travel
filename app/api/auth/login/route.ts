import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // #region agent log
    // 记录登录尝试
    fetch('http://127.0.0.1:7244/ingest/3d36902f-c49a-4d79-9c89-7a13eac53de2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/auth/login/route.ts:15',message:'登录尝试',data:{email, hasPassword: !!password},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: '邮箱和密码不能为空' },
        { status: 400 }
      )
    }

    const result = await authenticateUser(email, password)

    // #region agent log
    // 记录认证结果
    fetch('http://127.0.0.1:7244/ingest/3d36902f-c49a-4d79-9c89-7a13eac53de2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/auth/login/route.ts:25',message:'认证结果',data:{hasResult: !!result, hasUser: !!result?.user, hasToken: !!result?.token},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

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

    // #region agent log
    // 记录错误
    fetch('http://127.0.0.1:7244/ingest/3d36902f-c49a-4d79-9c89-7a13eac53de2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/auth/login/route.ts:37',message:'登录错误',data:{error: error?.message || error},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    return NextResponse.json(
      { success: false, error: '登录失败' },
      { status: 500 }
    )
  }
}