import { NextRequest, NextResponse } from 'next/server'
import { validateAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const { user, error } = validateAuth(request)

  if (!user) {
    return NextResponse.json(
      { success: false, error: error || '未认证' },
      { status: 401 }
    )
  }

  return NextResponse.json({
    success: true,
    data: { user }
  })
}