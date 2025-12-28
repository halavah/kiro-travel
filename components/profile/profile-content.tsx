"use client"

import { useState, useEffect } from "react"
import useSWR from "swr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { User, Mail, Phone, Calendar, Shield, Ticket, Hotel, Heart, MessageSquare, Loader2, Compass } from "lucide-react"
import type { Profile as UserType } from "@/lib/types"
import Link from "next/link"

const fetcher = (url: string) => {
  const token = localStorage.getItem('token')
  if (!token) {
    window.location.href = '/login'
    throw new Error('未登录')
  }
  return fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }).then(r => {
    if (r.status === 401) {
      window.location.href = '/login'
      throw new Error('未登录')
    }
    if (!r.ok) throw new Error('获取数据失败')
    return r.json()
  })
}

export function ProfileContent() {
  const { data: profileData, error: profileError, isLoading: profileLoading, mutate: mutateProfile } = useSWR('/api/profile', fetcher)
  const { data: statsData, error: statsError, isLoading: statsLoading } = useSWR('/api/profile/stats', fetcher)

  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    nickname: "",
    phone: "",
    avatar: "",
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const user: UserType | null = profileData?.data || null
  const stats = statsData?.data || {
    orders: 0,
    bookings: 0,
    favorites: 0,
    comments: 0,
    activities: 0,
  }

  // 当用户数据加载完成时，初始化表单
  useEffect(() => {
    if (user) {
      setFormData({
        nickname: user.nickname || "",
        phone: user.phone || "",
        avatar: user.avatar || "",
      })
    }
  }, [user])

  async function handleUpdateProfile() {
    if (!user) return
    setSaving(true)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nickname: formData.nickname,
          phone: formData.phone,
          avatar: formData.avatar,
        })
      })

      if (!response.ok) throw new Error('更新失败')

      mutateProfile()
      toast.success("个人信息更新成功")
    } catch (error) {
      toast.error("更新失败，请重试")
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  async function handleChangePassword() {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("两次输入的密码不一致")
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("密码长度至少为6位")
      return
    }

    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/profile/password', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          newPassword: passwordData.newPassword,
        })
      })

      if (!response.ok) throw new Error('密码修改失败')

      toast.success("密码修改成功")
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
    } catch (error) {
      toast.error("密码修改失败，请重试")
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  // 加载状态
  if (profileLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-16 w-16 mx-auto mb-4 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground ml-4">加载个人资料中...</p>
      </div>
    )
  }

  // 错误状态
  if (profileError || !user) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <User className="h-16 w-16 mx-auto mb-4 opacity-50 text-destructive" />
          <p className="text-lg font-semibold mb-2">加载失败</p>
          <p className="text-muted-foreground mb-4">{profileError?.message || '请先登录后查看个人中心'}</p>
          <Button asChild>
            <a href="/login">去登录</a>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* 顶部统计图标 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">快捷入口</h3>
            <div className="flex items-center gap-6">
              <Link href="/orders" className="flex flex-col items-center gap-1 hover:opacity-80 transition-opacity group">
                <div className="relative">
                  <Ticket className="h-6 w-6 text-orange-600" />
                  {stats.orders > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                      {stats.orders}
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground group-hover:text-foreground">门票订单</span>
              </Link>

              <Link href="/profile/bookings" className="flex flex-col items-center gap-1 hover:opacity-80 transition-opacity group">
                <div className="relative">
                  <Hotel className="h-6 w-6 text-blue-600" />
                  {stats.bookings > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                      {stats.bookings}
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground group-hover:text-foreground">酒店预订</span>
              </Link>

              <Link href="/profile/activities" className="flex flex-col items-center gap-1 hover:opacity-80 transition-opacity group">
                <div className="relative">
                  <Compass className="h-6 w-6 text-purple-600" />
                  {stats.activities > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                      {stats.activities}
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground group-hover:text-foreground">活动报名</span>
              </Link>

              <Link href="/favorites" className="flex flex-col items-center gap-1 hover:opacity-80 transition-opacity group">
                <div className="relative">
                  <Heart className="h-6 w-6 text-red-600" />
                  {stats.favorites > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                      {stats.favorites}
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground group-hover:text-foreground">收藏景点</span>
              </Link>

              <div className="flex flex-col items-center gap-1">
                <div className="relative">
                  <MessageSquare className="h-6 w-6 text-green-600" />
                  {stats.comments > 0 && (
                    <Badge variant="secondary" className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                      {stats.comments}
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">评论数</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 用户概览卡片 */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={user.avatar || ""} alt={user.nickname || ""} />
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                {user.nickname?.[0] || user.email?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <h2 className="text-2xl font-bold">{user.nickname || "未设置昵称"}</h2>
                <Badge variant={user.role === "guide" ? "default" : "secondary"}>
                  {user.role === "guide" ? "导游" : "用户"}
                </Badge>
              </div>
              <p className="text-muted-foreground flex items-center justify-center md:justify-start gap-2">
                <Mail className="h-4 w-4" />
                {user.email}
              </p>
              {user.phone && (
                <p className="text-muted-foreground flex items-center justify-center md:justify-start gap-2 mt-1">
                  <Phone className="h-4 w-4" />
                  {user.phone}
                </p>
              )}
              <p className="text-sm text-muted-foreground mt-2 flex items-center justify-center md:justify-start gap-2">
                <Calendar className="h-4 w-4" />
                注册时间：{new Date(user.created_at).toLocaleDateString("zh-CN")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 设置标签页 */}
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            个人信息
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            安全设置
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>编辑个人信息</CardTitle>
              <CardDescription>更新您的个人资料信息</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nickname">昵称</Label>
                  <Input
                    id="nickname"
                    value={formData.nickname}
                    onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                    placeholder="请输入昵称"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">手机号码</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="请输入手机号码"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="avatar">头像链接</Label>
                <Input
                  id="avatar"
                  value={formData.avatar}
                  onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                  placeholder="请输入头像图片URL"
                />
              </div>
              <Button onClick={handleUpdateProfile} disabled={saving}>
                {saving ? "保存中..." : "保存修改"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>修改密码</CardTitle>
              <CardDescription>定期更换密码可以提高账户安全性</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">新密码</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  placeholder="请输入新密码（至少6位）"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">确认新密码</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  placeholder="请再次输入新密码"
                />
              </div>
              <Button onClick={handleChangePassword} disabled={saving}>
                {saving ? "修改中..." : "修改密码"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
