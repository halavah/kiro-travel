'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface User {
  id: number
  email: string
  full_name: string
  role: 'user' | 'guide' | 'admin'
  avatar_url?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (data: {
    email: string
    password: string
    full_name: string
    role?: string
  }) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 从 cookie 检查用户登录状态
    fetchCurrentUser()
  }, [])

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include' // 自动发送 cookie
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setUser(data.data.user)
          // token 存储在 httpOnly cookie 中，我们不需要在客户端保存
          setToken('cookie-based') // 标记为 cookie 认证
        }
      } else {
        setUser(null)
        setToken(null)
      }
    } catch (error) {
      console.error('Error fetching current user:', error)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // 自动发送和接收 cookie
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (data.success) {
        setUser(data.data.user)
        setToken('cookie-based') // 标记为 cookie 认证
        // Cookie 已由服务器设置，不需要 localStorage
        return { success: true }
      } else {
        return { success: false, error: data.error }
      }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: '登录失败，请重试' }
    }
  }

  const register = async (registerData: {
    email: string
    password: string
    full_name: string
    role?: string
  }) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // 自动发送和接收 cookie
        body: JSON.stringify(registerData)
      })

      const data = await response.json()

      if (data.success) {
        setUser(data.data.user)
        setToken('cookie-based') // 标记为 cookie 认证
        // Cookie 已由服务器设置，不需要 localStorage
        return { success: true }
      } else {
        return { success: false, error: data.error }
      }
    } catch (error) {
      console.error('Register error:', error)
      return { success: false, error: '注册失败，请重试' }
    }
  }

  const logout = async () => {
    try {
      // 调用登出 API 清除 cookie
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
    } catch (error) {
      console.error('Logout error:', error)
    }

    setUser(null)
    setToken(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        loading
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}