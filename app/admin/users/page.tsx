'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Search, Mail, Shield, Calendar, Eye } from "lucide-react"
import Link from "next/link"

interface User {
  id: string
  email: string
  username: string | null
  phone: string | null
  avatar_url: string | null
  role: 'user' | 'guide' | 'admin'
  status: 'active' | 'inactive'
  created_at: string
  last_login: string | null
  order_count: number
  total_spent: number
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams()
      if (roleFilter !== 'all') params.append('role', roleFilter)
      if (statusFilter !== 'all') params.append('status', statusFilter)

      const res = await fetch(`/api/admin/users?${params}`)
      if (!res.ok) throw new Error('Failed to fetch users')

      const data = await res.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [roleFilter, statusFilter])

  const handleViewUser = (user: User) => {
    setSelectedUser(user)
    setIsDetailDialogOpen(true)
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      })

      if (!res.ok) throw new Error('Failed to update role')

      // 更新本地状态
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole as 'user' | 'guide' | 'admin' } : u))
    } catch (error) {
      console.error('Error updating user role:', error)
      alert('更新角色失败')
    }
  }

  const handleStatusToggle = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (!res.ok) throw new Error('Failed to update status')

      // 更新本地状态
      setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus as 'active' | 'inactive' } : u))
    } catch (error) {
      console.error('Error updating user status:', error)
      alert('更新状态失败')
    }
  }

  const filteredUsers = users.filter(user => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return (
        user.email.toLowerCase().includes(searchLower) ||
        user.username?.toLowerCase().includes(searchLower) ||
        user.phone?.includes(searchTerm)
      )
    }
    return true
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">用户管理</h1>
        <div className="text-center py-12">加载中...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">用户管理</h1>
        <p className="text-muted-foreground">管理平台所有用户信息</p>
      </div>

      {/* 筛选和搜索 */}
      <Card>
        <CardHeader>
          <CardTitle>筛选条件</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="搜索邮箱、用户名或手机号"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="角色筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部角色</SelectItem>
                <SelectItem value="user">普通用户</SelectItem>
                <SelectItem value="guide">导游</SelectItem>
                <SelectItem value="admin">管理员</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="状态筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="active">活跃</SelectItem>
                <SelectItem value="inactive">禁用</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 用户列表 */}
      <Card>
        <CardHeader>
          <CardTitle>用户列表 ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>用户</TableHead>
                <TableHead>联系方式</TableHead>
                <TableHead>角色</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>注册时间</TableHead>
                <TableHead>订单统计</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={user.avatar_url || ''} />
                        <AvatarFallback>
                          {user.username?.[0] || user.email[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.username || '未设置昵称'}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.phone && (
                      <p className="text-sm">{user.phone}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={user.role}
                      onValueChange={(value) => handleRoleChange(user.id, value)}
                      disabled={user.role === 'admin' && user.id !== '1'} // 防止修改其他管理员
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">用户</SelectItem>
                        <SelectItem value="guide">导游</SelectItem>
                        <SelectItem value="admin">管理员</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant={user.status === 'active' ? 'default' : 'secondary'}
                      size="sm"
                      onClick={() => handleStatusToggle(user.id, user.status)}
                    >
                      {user.status === 'active' ? '活跃' : '禁用'}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{formatDate(user.created_at)}</div>
                      {user.last_login && (
                        <div className="text-muted-foreground">
                          最后登录: {formatDate(user.last_login)}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{user.order_count} 个订单</div>
                      <div>¥{user.total_spent.toFixed(2)}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewUser(user)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      查看详情
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredUsers.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              暂无用户数据
            </div>
          )}
        </CardContent>
      </Card>

      {/* 用户详情对话框 */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>用户详情</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedUser.avatar_url || ''} />
                  <AvatarFallback className="text-lg">
                    {selectedUser.username?.[0] || selectedUser.email[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">
                    {selectedUser.username || '未设置昵称'}
                  </h3>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                </div>
              </div>

              <div className="grid gap-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">用户ID:</span>
                  <span className="font-mono text-sm">{selectedUser.id}</span>
                </div>
                {selectedUser.phone && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">手机号:</span>
                    <span>{selectedUser.phone}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">角色:</span>
                  <Badge variant="outline">
                    {selectedUser.role === 'admin' ? '管理员' :
                     selectedUser.role === 'guide' ? '导游' : '用户'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">状态:</span>
                  <Badge variant={selectedUser.status === 'active' ? 'default' : 'secondary'}>
                    {selectedUser.status === 'active' ? '活跃' : '禁用'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">注册时间:</span>
                  <span className="text-sm">{formatDate(selectedUser.created_at)}</span>
                </div>
                {selectedUser.last_login && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">最后登录:</span>
                    <span className="text-sm">{formatDate(selectedUser.last_login)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">订单总数:</span>
                  <span>{selectedUser.order_count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">累计消费:</span>
                  <span>¥{selectedUser.total_spent.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}