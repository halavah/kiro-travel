'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function withAuth<T extends Record<string, any>>(Component: React.ComponentType<T>) {
  return function AuthenticatedComponent(props: T) {
    const router = useRouter()

    useEffect(() => {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }
    }, [router])

    // 简单的认证检查
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!token) {
      return null // 或者显示加载状态
    }

    return <Component {...props} />
  }
}