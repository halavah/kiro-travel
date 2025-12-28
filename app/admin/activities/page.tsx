'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Search, Plus, Edit, Trash2, Power, Calendar, MapPin, Users } from "lucide-react"
import { toast } from "sonner"
import MultiImageUpload from '@/components/admin/MultiImageUpload'
import Pagination from '@/components/admin/Pagination'
import { Checkbox } from "@/components/ui/checkbox"
import Image from 'next/image'

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
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [selectedActivityIds, setSelectedActivityIds] = useState<number[]>([])
  const [selectAll, setSelectAll] = useState(false)
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
      setCurrentPage(1) // 重置到第一页
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (!formData.title || !formData.location || !formData.start_time || !formData.end_time) {
        toast.error('请填写所有必填字段')
        return
      }

      const token = localStorage.getItem('token')
      const url = editingActivity ? `/api/activities/${editingActivity.id}` : '/api/activities'
      const method = editingActivity ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
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

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || '操作失败')
      }

      toast.success(editingActivity ? '活动更新成功' : '活动创建成功')
      setIsAddDialogOpen(false)
      setEditingActivity(null)
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
      fetchActivities()
    } catch (error: any) {
      toast.error(error.message || '操作失败')
    }
  }

  const handleEdit = (activity: Activity) => {
    setEditingActivity(activity)
    setFormData({
      title: activity.title,
      description: activity.description || '',
      location: activity.location,
      start_time: activity.start_time,
      end_time: activity.end_time,
      max_participants: activity.max_participants.toString(),
      price: activity.price.toString(),
      images: activity.images && activity.images.length > 0 ? activity.images : [''],
      status: activity.status
    })
    setIsAddDialogOpen(true)
  }

  const handleDelete = async (activityId: number) => {
    if (!confirm('确定要删除这个活动吗？')) return

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/activities/${activityId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || '删除失败')
      }

      toast.success('活动删除成功')
      fetchActivities()
    } catch (error: any) {
      toast.error(error.message || '删除失败')
    }
  }

  const handleToggleStatus = async (activityId: number, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    const statusText = newStatus === 'active' ? '上架' : '下架'

    try {
      const activity = activities.find(a => a.id === activityId)
      if (!activity) return

      const token = localStorage.getItem('token')
      const res = await fetch(`/api/activities/${activityId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: activity.title,
          description: activity.description,
          location: activity.location,
          start_time: activity.start_time,
          end_time: activity.end_time,
          max_participants: activity.max_participants,
          price: activity.price,
          images: activity.images,
          status: newStatus
        })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || '状态更新失败')
      }

      toast.success(`活动已${statusText}`)
      fetchActivities()
    } catch (error: any) {
      toast.error(error.message || '状态更新失败')
    }
  }

  // 全选/取消全选
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedActivityIds([])
      setSelectAll(false)
    } else {
      setSelectedActivityIds(paginatedActivities.map(activity => activity.id))
      setSelectAll(true)
    }
  }

  // 单个选择
  const handleSelectActivity = (activityId: number) => {
    setSelectedActivityIds(prev => {
      if (prev.includes(activityId)) {
        const newSelected = prev.filter(id => id !== activityId)
        if (newSelected.length === 0) setSelectAll(false)
        return newSelected
      } else {
        const newSelected = [...prev, activityId]
        if (newSelected.length === paginatedActivities.length) setSelectAll(true)
        return newSelected
      }
    })
  }

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedActivityIds.length === 0) {
      toast.error('请至少选择一个活动')
      return
    }

    if (!confirm(`确定要删除选中的 ${selectedActivityIds.length} 个活动吗？此操作不可恢复。`)) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const deletePromises = selectedActivityIds.map(activityId =>
        fetch(`/api/activities/${activityId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      )

      const results = await Promise.all(deletePromises)
      const failedCount = results.filter(r => !r.ok).length

      if (failedCount === 0) {
        toast.success(`成功删除 ${selectedActivityIds.length} 个活动`)
      } else {
        toast.warning(`删除完成，但有 ${failedCount} 个活动删除失败`)
      }

      setSelectedActivityIds([])
      setSelectAll(false)
      fetchActivities()
    } catch (error) {
      console.error('Error deleting activities:', error)
      toast.error('批量删除失败')
    }
  }

  // 批量修改状态
  const handleBatchStatusChange = async (newStatus: string) => {
    if (selectedActivityIds.length === 0) {
      toast.error('请至少选择一个活动')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const updatePromises = selectedActivityIds.map(activityId => {
        const activity = activities.find(a => a.id === activityId)
        if (!activity) return Promise.resolve({ ok: false })

        return fetch(`/api/activities/${activityId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            title: activity.title,
            description: activity.description,
            location: activity.location,
            start_time: activity.start_time,
            end_time: activity.end_time,
            max_participants: activity.max_participants,
            price: activity.price,
            images: activity.images,
            status: newStatus
          })
        })
      })

      const results = await Promise.all(updatePromises)
      const failedCount = results.filter(r => !r.ok).length

      if (failedCount === 0) {
        toast.success(`成功更新 ${selectedActivityIds.length} 个活动的状态`)
      } else {
        toast.warning(`更新完成，但有 ${failedCount} 个活动更新失败`)
      }

      setSelectedActivityIds([])
      setSelectAll(false)
      fetchActivities()
    } catch (error) {
      console.error('Error updating activity status:', error)
      toast.error('批量更新失败')
    }
  }

  const filteredActivities = activities.filter(activity => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return (
        activity.title.toLowerCase().includes(searchLower) ||
        activity.location.toLowerCase().includes(searchLower) ||
        (activity.description && activity.description.toLowerCase().includes(searchLower))
      )
    }
    return true
  })

  // 分页逻辑
  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedActivities = filteredActivities.slice(startIndex, endIndex)

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString('zh-CN', {
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
        <h1 className="text-3xl font-bold">旅游活动管理</h1>
        <div className="text-center py-12">加载中...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">旅游活动管理</h1>
          <p className="text-muted-foreground">管理平台上的所有旅游活动</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingActivity(null)
              setFormData({
                title: '',
                description: '',
                location: '',
                start_time: '',
                end_time: '',
                max_participants: '',
                price: '',
                images: [''],
                status: 'active'
              })
            }}>
              <Plus className="h-4 w-4 mr-2" />
              添加活动
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>{editingActivity ? '编辑活动' : '添加新活动'}</DialogTitle>
              <DialogDescription>
                {editingActivity ? '修改活动信息' : '创建一个新的旅游活动'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">
                    活动标题
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="description" className="text-right pt-2">
                    描述
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="col-span-3"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="location" className="text-right">
                    活动地点
                  </Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="start_time" className="text-right">
                    开始时间
                  </Label>
                  <Input
                    id="start_time"
                    type="datetime-local"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="end_time" className="text-right">
                    结束时间
                  </Label>
                  <Input
                    id="end_time"
                    type="datetime-local"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="price" className="text-right">
                    价格 (元)
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="col-span-3"
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="max_participants" className="text-right">
                    最大人数
                  </Label>
                  <Input
                    id="max_participants"
                    type="number"
                    value={formData.max_participants}
                    onChange={(e) => setFormData({ ...formData, max_participants: e.target.value })}
                    className="col-span-3"
                    placeholder="不限"
                  />
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label className="text-right pt-2">
                    图片
                  </Label>
                  <div className="col-span-3">
                    <MultiImageUpload
                      value={formData.images}
                      onChange={(urls) => setFormData({ ...formData, images: urls })}
                      maxImages={5}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">
                  {editingActivity ? '更新' : '创建'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
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
                  placeholder="搜索活动标题或地点"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="状态筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="active">上架</SelectItem>
                <SelectItem value="inactive">下架</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 活动列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>活动列表 ({filteredActivities.length})</CardTitle>
            {selectedActivityIds.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  已选择 {selectedActivityIds.length} 项
                </span>
                <Select onValueChange={handleBatchStatusChange}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="批量修改状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">设为上架</SelectItem>
                    <SelectItem value="inactive">设为下架</SelectItem>
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
                <TableHead>活动</TableHead>
                <TableHead>地点</TableHead>
                <TableHead>时间</TableHead>
                <TableHead>价格</TableHead>
                <TableHead>参与人数</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedActivities.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedActivityIds.includes(activity.id)}
                      onCheckedChange={() => handleSelectActivity(activity.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {activity.images?.[0] && (
                        <div className="relative w-16 h-16">
                          <Image
                            src={activity.images[0]}
                            alt={activity.title}
                            fill
                            className="object-cover rounded"
                          />
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{activity.title}</p>
                        {activity.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {activity.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <MapPin className="h-3 w-3" />
                      {activity.location}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDateTime(activity.start_time)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">¥{activity.price}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Users className="h-3 w-3" />
                      {activity.participant_count || 0} / {activity.max_participants || '∞'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={activity.status === 'active' ? 'default' : 'secondary'}>
                      {activity.status === 'active' ? '上架' : '下架'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(activity.id, activity.status)}
                        title={activity.status === 'active' ? '下架' : '上架'}
                      >
                        <Power className={`h-4 w-4 ${activity.status === 'active' ? 'text-green-600' : 'text-gray-400'}`} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(activity)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(activity.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredActivities.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              暂无活动数据
            </div>
          )}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            totalItems={filteredActivities.length}
          />
        </CardContent>
      </Card>
    </div>
  )
}
