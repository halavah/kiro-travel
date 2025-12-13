import { NextRequest } from 'next/server'
import { verifyToken } from './auth'

// 从请求中获取token
export function getTokenFromRequest(request: NextRequest): string | null {
  // 首先尝试从Authorization header获取
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  // 然后尝试从cookie获取
  const token = request.cookies.get('token')?.value
  if (token) {
    return token
  }

  return null
}

// 验证请求并返回用户信息
export function validateRequest(request: NextRequest): { userId?: string; error?: string } {
  const token = getTokenFromRequest(request)

  if (!token) {
    return { error: '未提供认证令牌' }
  }

  const decoded = verifyToken(token)
  if (!decoded) {
    return { error: '无效的认证令牌' }
  }

  return { userId: decoded.userId }
}