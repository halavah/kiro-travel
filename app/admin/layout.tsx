'use client'

import { AdminNav } from "@/components/admin/admin-nav"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { useAuth } from "@/contexts/auth-context"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      // 未登录或不是管理员，跳转到登录页
      if (!user || user.role !== 'admin') {
        router.push('/auth/login')
      }
    }
  }, [user, loading, router])

  // 加载中或未授权时显示空白
  if (loading || !user || user.role !== 'admin') {
    return null
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <AdminNav />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}