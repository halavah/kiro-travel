import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { dbGet, dbRun } from './db-utils'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const JWT_EXPIRES_IN = '7d'

// JWT 工具函数
export function generateToken(payload: any): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}

// 密码加密
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10)
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash)
}

// 用户认证
export async function authenticateUser(email: string, password: string) {
  const user = dbGet(
    `SELECT id, email, password_hash, full_name, role, avatar_url FROM profiles WHERE email = ?`,
    [email]
  )

  if (!user || !user.password_hash) {
    return null
  }

  const isValidPassword = await comparePassword(password, user.password_hash)

  if (!isValidPassword) {
    return null
  }

  // 移除密码哈希
  delete user.password_hash

  // 生成 JWT
  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role
  })

  return { user, token }
}

// 注册用户
export async function registerUser(userData: {
  email: string
  password: string
  full_name: string
  role?: string
}) {
  // 检查用户是否已存在
  const existingUser = dbGet('SELECT id FROM profiles WHERE email = ?', [userData.email])
  if (existingUser) {
    throw new Error('用户已存在')
  }

  // 加密密码
  const password_hash = await hashPassword(userData.password)

  // 创建用户
  const { lastInsertRowid } = dbRun(
    `INSERT INTO profiles (email, password_hash, full_name, role) VALUES (?, ?, ?, ?)`,
    [userData.email, password_hash, userData.full_name, userData.role || 'user']
  )

  // 返回用户信息（不含密码）
  const user = dbGet(
    `SELECT id, email, full_name, role, avatar_url FROM profiles WHERE id = ?`,
    [lastInsertRowid]
  )

  // 生成 JWT
  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role
  })

  return { user, token }
}

// 中间件：验证请求中的 JWT
export function validateAuth(request: Request): { user: any; error?: string } {
  // 首先尝试从 Authorization header 获取 token
  let token = null
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7)
  }

  // 如果 header 中没有，尝试从 cookie 获取
  if (!token) {
    const cookieHeader = request.headers.get('cookie')
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=')
        acc[key] = value
        return acc
      }, {} as Record<string, string>)
      token = cookies.token
    }
  }

  if (!token) {
    return { user: null, error: '未提供认证令牌' }
  }

  const decoded = verifyToken(token)
  if (!decoded) {
    return { user: null, error: '无效的认证令牌' }
  }

  // 获取用户信息
  const user = dbGet(
    `SELECT id, email, full_name, role, avatar_url FROM profiles WHERE id = ?`,
    [decoded.userId]
  )

  if (!user) {
    return { user: null, error: '用户不存在' }
  }

  return { user }
}

// 角色权限检查
export function checkRole(userRole: string, requiredRole: string): boolean {
  const roleHierarchy = {
    'admin': 3,
    'guide': 2,
    'user': 1
  }

  return roleHierarchy[userRole as keyof typeof roleHierarchy] >=
         roleHierarchy[requiredRole as keyof typeof roleHierarchy]
}