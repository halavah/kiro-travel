import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const token = req.cookies.get('token')?.value

  return NextResponse.json({
    hasCookie: !!token,
    tokenLength: token?.length || 0,
    allCookies: req.cookies.getAll(),
    cookieHeader: req.headers.get('cookie')
  })
}
