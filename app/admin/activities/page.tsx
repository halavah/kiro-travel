'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Search, Plus, Edit, Trash2, Power, Calendar, MapPin, Users } from "lucide-react"
import { toast } from "sonner"
import MultiImageUpload from '@/components/admin/MultiImageUpload'
import { Checkbox } from "@/components/ui/checkbox"

interface Activity {
  id: number
  title: string
  description: string
  location: string
  start_time: string
  end_time: string
  max_participants: number
  price: number
  images: string[]
  status: string
  participant_count: number
  created_at: string
}

export default function AdminActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)
  const [selectedActivityIds, setSelectedActivityIds] = useState<number[]>([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    start_time: '',
    end_time: '',
    max_participants: '',
    price: '',
    images: [] as string[],
    status: 'active'
  })

  const fetchActivities = async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)

      const token = localStorage.getItem('token')
      const res = await fetch(`/api/admin/activities?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!res.ok) throw new Error('Failed to fetch activities')

      const data = await res.json()
      setActivities(data.data || [])
    } catch (error) {
      console.error('Error fetching activities:', error)
      toast.error('获取活动列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchActivities()
  }, [statusFilter])

  const handleAdd = async () => {
    try {
      if (!formData.title || !formData.location || !formData.start_time || !formData.end_time) {
        toast.error('请填写所有必填字段')
        return
      }

      const token = localStorage.getItem('token')
      const res = await fetch('/api/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          max_participants: parseInt(formData.max_participants) || 0,
          price: parseFloat(formData.price) || 0
        })
      })

      if (!res.ok) throw new Error('Failed to create activity')

      toast.success('活动创建成功')
      setIsAddDialogOpen(false)
      resetForm()
      fetchActivities()
    } catch (error) {
      console.error('Error creating activity:', error)
      toast.error('创建活动失败')
    }
  }

  const handleEdit = async () => {
    if (!editingActivity) return

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/activities/${editingActivity.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          max_participants: parseInt(formData.max_participants) || 0,
          price: parseFloat(formData.price) || 0
        })
      })

      if (!res.ok) throw new Error('Failed to update activity')

      toast.success('活动更新成功')
      setEditingActivity(null)
      resetForm()
      fetchActivities()
    } catch (error) {
      console.error('Error updating activity:', error)
      toast.error('更新活动失败')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个活动吗？')) return

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/activities/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!res.ok) throw new Error('Failed to delete activity')

      toast.success('活动删除成功')
      fetchActivities()
    } catch (error) {
      console.error('Error deleting activity:', error)
      toast.error('删除活动失败')
    }
  }

  const handleToggleStatus = async (id: number, currentStatus: string) => {
    try {
      const activity = activities.find(a => a.id === id)
      if (!activity) return

      const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/activities/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...activity,
          status: newStatus
        })
      })

      if (!res.ok) throw new Error('Failed to toggle status')

      toast.success(`活动已${newStatus === 'active' ? '上架' : '下架'}`)
      fetchActivities()
    } catch (error) {
      console.error('Error toggling status:', error)
      toast.error('状态切换失败')
    }
  }

  const handleBatchStatusChange = async (status: 'active' | 'inactive') => {
    if (selectedActivityIds.length === 0) {
      toast.error('请先选择活动')
      return
    }

    try {
      const token = localStorage.getItem('token')
      await Promise.all(selectedActivityIds.map(async (id) => {
        const activity = activities.find(a => a.id === id)
        if (!activity) return

        await fetch(`/api/activities/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            ...activity,
            status
          })
        })
      }))

      toast.success(`已批量${status === 'active' ? '上架' : '下架'}`)
      setSelectedActivityIds([])
      fetchActivities()
    } catch (error) {
      console.error('Error batch updating status:', error)
      toast.error('批量操作失败')
    }
  }

  const openEditDialog = (activity: Activity) => {
    setEditingActivity(activity)
    setFormData({
      title: activity.title,
      description: activity.description || '',
      location: activity.location,
      start_time: activity.start_time,
      end_time: activity.end_time,
      max_participants: activity.max_participants.toString(),
      price: activity.price.toString(),
      images: activity.images || [],
      status: activity.status
    })
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      location: '',
      start_time: '',
      end_time: '',
      max_participants: '',
      price: '',
      images: [],
      status: 'active'
    })
  }

  const filteredActivities = activities.filter(activity =>
    activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.location.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">旅游活动管理</h1>
        <p className="text-muted-foreground">管理平台上的所有旅游活动</p>
      </div>

      {/* 过滤和操作栏 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="搜索活动标题或地点..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="active">已上架</SelectItem>
                <SelectItem value="inactive">已下架</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              添加活动
            </Button>
          </div>

          {/* 批量操作 */}
          {selectedActivityIds.length > 0 && (
            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleBatchStatusChange('active')}>
                批量上架 ({selectedActivityIds.length})
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleBatchStatusChange('inactive')}>
                批量下架 ({selectedActivityIds.length})
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 活动列表 */}
      <Card>
        <CardHeader>
          <CardTitle>活动列表 ({filteredActivities.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">加载中...</div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">暂无活动</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={selectedActivityIds.length === filteredActivities.length}
                      onCheckedChange={(checked) => {
                        setSelectedActivityIds(checked ? filteredActivities.map(a => a.id) : [])
                      }}
                    />
                  </TableHead>
                  <TableHead>活动标题</TableHead>
                  <TableHead>地点</TableHead>
                  <TableHead>开始时间</TableHead>
                  <TableHead>价格</TableHead>
                  <TableHead>参与人数</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredActivities.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedActivityIds.includes(activity.id)}
                        onCheckedChange={(checked) => {
                          setSelectedActivityIds(
                            checked
                              ? [...selectedActivityIds, activity.id]
                              : selectedActivityIds.filter(id => id !== activity.id)
                          )
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{activity.title}</div>
                      {activity.description && (
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {activity.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {activity.location}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDateTime(activity.start_time)}
                      </div>
                    </TableCell>
                    <TableCell>¥{activity.price}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {activity.participant_count || 0} / {activity.max_participants || '∞'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={activity.status === 'active' ? 'default' : 'secondary'}>
                        {activity.status === 'active' ? '已上架' : '已下架'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(activity.id, activity.status)}
                        >
                          <Power className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(activity)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(activity.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 添加/编辑对话框 */}
      <Dialog open={isAddDialogOpen || editingActivity !== null} onOpenChange={(open) => {
        if (!open) {
          setIsAddDialogOpen(false)
          setEditingActivity(null)
          resetForm()
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingActivity ? '编辑活动' : '添加活动'}</DialogTitle>
            <DialogDescription>
              {editingActivity ? '修改活动信息' : '创建新的旅游活动'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">活动标题 *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="输入活动标题"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">活动描述</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="输入活动描述"
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location">活动地点 *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="输入活动地点"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="start_time">开始时间 *</Label>
                <Input
                  id="start_time"
                  type="datetime-local"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="end_time">结束时间 *</Label>
                <Input
                  id="end_time"
                  type="datetime-local"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="price">价格 (元)</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="max_participants">最大参与人数</Label>
                <Input
                  id="max_participants"
                  type="number"
                  value={formData.max_participants}
                  onChange={(e) => setFormData({ ...formData, max_participants: e.target.value })}
                  placeholder="不限"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">状态</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">已上架</SelectItem>
                  <SelectItem value="inactive">已下架</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>活动图片</Label>
              <MultiImageUpload
                images={formData.images}
                onChange={(images) => setFormData({ ...formData, images })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddDialogOpen(false)
              setEditingActivity(null)
              resetForm()
            }}>
              取消
            </Button>
            <Button onClick={editingActivity ? handleEdit : handleAdd}>
              {editingActivity ? '保存' : '创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
