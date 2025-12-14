'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Search, Mail, Shield, Calendar, Eye, Trash2 } from "lucide-react"
import Link from "next/link"
import Pagination from '@/components/admin/Pagination'
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from 'sonner'

interface User {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: 'user' | 'guide' | 'admin'
  created_at: string
  order_count: number
  total_spent: number
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams()
      if (roleFilter !== 'all') params.append('role', roleFilter)

      const token = localStorage.getItem('token')

      const res = await fetch(`/api/admin/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!res.ok) throw new Error('Failed to fetch users')

      const data = await res.json()
      setUsers(data.users || [])
      setCurrentPage(1) // 重置到第一页
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [roleFilter])

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
      toast.success('角色更新成功')
    } catch (error) {
      console.error('Error updating user role:', error)
      toast.error('更新角色失败')
    }
  }

  // 全选/取消全选
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedUserIds([])
      setSelectAll(false)
    } else {
      setSelectedUserIds(paginatedUsers.map(user => user.id))
      setSelectAll(true)
    }
  }

  // 单个选择
  const handleSelectUser = (userId: string) => {
    setSelectedUserIds(prev => {
      if (prev.includes(userId)) {
        const newSelected = prev.filter(id => id !== userId)
        if (newSelected.length === 0) setSelectAll(false)
        return newSelected
      } else {
        const newSelected = [...prev, userId]
        if (newSelected.length === paginatedUsers.length) setSelectAll(true)
        return newSelected
      }
    })
  }

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedUserIds.length === 0) {
      toast.error('请至少选择一个用户')
      return
    }

    if (!confirm(`确定要删除选中的 ${selectedUserIds.length} 个用户吗？此操作不可恢复。`)) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const deletePromises = selectedUserIds.map(userId =>
        fetch(`/api/admin/users/${userId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      )

      const results = await Promise.all(deletePromises)
      const failedCount = results.filter(r => !r.ok).length

      if (failedCount === 0) {
        toast.success(`成功删除 ${selectedUserIds.length} 个用户`)
      } else {
        toast.warning(`删除完成，但有 ${failedCount} 个用户删除失败`)
      }

      setSelectedUserIds([])
      setSelectAll(false)
      fetchUsers()
    } catch (error) {
      console.error('Error deleting users:', error)
      toast.error('批量删除失败')
    }
  }

  // 批量修改角色
  const handleBatchRoleChange = async (newRole: string) => {
    if (selectedUserIds.length === 0) {
      toast.error('请至少选择一个用户')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const updatePromises = selectedUserIds.map(userId =>
        fetch(`/api/admin/users/${userId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ role: newRole })
        })
      )

      const results = await Promise.all(updatePromises)
      const failedCount = results.filter(r => !r.ok).length

      if (failedCount === 0) {
        toast.success(`成功更新 ${selectedUserIds.length} 个用户的角色`)
      } else {
        toast.warning(`更新完成，但有 ${failedCount} 个用户更新失败`)
      }

      setSelectedUserIds([])
      setSelectAll(false)
      fetchUsers()
    } catch (error) {
      console.error('Error updating roles:', error)
      toast.error('批量更新失败')
    }
  }

  
  const filteredUsers = users.filter(user => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return (
        user.email.toLowerCase().includes(searchLower) ||
        user.full_name?.toLowerCase().includes(searchLower)
      )
    }
    return true
  })

  // 分页逻辑
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex)

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
                  placeholder="搜索邮箱或姓名"
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
          </div>
        </CardContent>
      </Card>

      {/* 用户列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>用户列表 ({filteredUsers.length})</CardTitle>
            {selectedUserIds.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  已选择 {selectedUserIds.length} 项
                </span>
                <Select onValueChange={handleBatchRoleChange}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="批量修改角色" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">设为用户</SelectItem>
                    <SelectItem value="guide">设为导游</SelectItem>
                    <SelectItem value="admin">设为管理员</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBatchDelete}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  批量删除
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={selectAll}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>用户</TableHead>
                <TableHead>角色</TableHead>
                <TableHead>注册时间</TableHead>
                <TableHead>订单统计</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedUserIds.includes(user.id)}
                      onCheckedChange={() => handleSelectUser(user.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={user.avatar_url || ''} />
                        <AvatarFallback>
                          {user.full_name?.[0] || user.email[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.full_name || '未设置姓名'}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
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
                    {formatDate(user.created_at)}
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
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            totalItems={filteredUsers.length}
          />
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
                <div className="flex justify-between">
                  <span className="text-muted-foreground">角色:</span>
                  <Badge variant="outline">
                    {selectedUser.role === 'admin' ? '管理员' :
                     selectedUser.role === 'guide' ? '导游' : '用户'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">注册时间:</span>
                  <span className="text-sm">{formatDate(selectedUser.created_at)}</span>
                </div>
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