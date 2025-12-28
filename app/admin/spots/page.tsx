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
import { Search, Plus, Edit, Trash2, Star, Eye, MapPin, Power } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import Image from 'next/image'
import MultiImageUpload from '@/components/admin/MultiImageUpload'
import Pagination from '@/components/admin/Pagination'
import { Checkbox } from "@/components/ui/checkbox"

interface Spot {
  id: string
  name: string
  description: string
  location: string
  price: number
  rating: number
  is_recommended: number
  view_count: number
  status: string
  category_id: string
  category_name: string
  images: string[]
  created_at: string
}

export default function AdminSpotsPage() {
  const [spots, setSpots] = useState<Spot[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingSpot, setEditingSpot] = useState<Spot | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [selectedSpotIds, setSelectedSpotIds] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    price: '',
    category_id: '',
    is_recommended: false,
    images: [] as string[],
    status: 'active'
  })
  const [categories, setCategories] = useState<any[]>([])

  const fetchSpots = async () => {
    try {
      const params = new URLSearchParams()
      if (categoryFilter !== 'all') params.append('category', categoryFilter)
      if (statusFilter !== 'all') params.append('status', statusFilter)

      const token = localStorage.getItem('token')
      const res = await fetch(`/api/admin/spots?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!res.ok) throw new Error('Failed to fetch spots')

      const data = await res.json()
      setSpots(data.spots || [])
      setCurrentPage(1) // 重置到第一页
    } catch (error) {
      console.error('Error fetching spots:', error)
      toast.error('获取景点列表失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories')
      if (!res.ok) throw new Error('Failed to fetch categories')

      const data = await res.json()
      setCategories(data.data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  useEffect(() => {
    fetchSpots()
    fetchCategories()
  }, [categoryFilter, statusFilter])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const token = localStorage.getItem('token')
      const url = editingSpot ? `/api/admin/spots/${editingSpot.id}` : '/api/admin/spots'
      const method = editingSpot ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          is_recommended: formData.is_recommended ? 1 : 0
        })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || '操作失败')
      }

      toast.success(editingSpot ? '景点更新成功' : '景点创建成功')
      setIsAddDialogOpen(false)
      setEditingSpot(null)
      setFormData({
        name: '',
        description: '',
        location: '',
        price: '',
        category_id: '',
        is_recommended: false,
        images: [],
        status: 'active'
      })
      fetchSpots()
    } catch (error: any) {
      toast.error(error.message || '操作失败')
    }
  }

  const handleEdit = (spot: Spot) => {
    setEditingSpot(spot)
    setFormData({
      name: spot.name,
      description: spot.description,
      location: spot.location,
      price: spot.price.toString(),
      category_id: spot.category_id,
      is_recommended: spot.is_recommended === 1,
      images: spot.images && spot.images.length > 0 ? spot.images : [''],
      status: spot.status
    })
    setIsAddDialogOpen(true)
  }

  const handleDelete = async (spotId: string) => {
    if (!confirm('确定要删除这个景点吗？')) return

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/admin/spots/${spotId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || '删除失败')
      }

      toast.success('景点删除成功')
      fetchSpots()
    } catch (error: any) {
      toast.error(error.message || '删除失败')
    }
  }

  const handleToggleStatus = async (spotId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    const statusText = newStatus === 'active' ? '上架' : '下架'

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/admin/spots/${spotId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || '状态更新失败')
      }

      toast.success(`景点已${statusText}`)
      fetchSpots()
    } catch (error: any) {
      toast.error(error.message || '状态更新失败')
    }
  }

  // 全选/取消全选
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedSpotIds([])
      setSelectAll(false)
    } else {
      setSelectedSpotIds(paginatedSpots.map(spot => spot.id))
      setSelectAll(true)
    }
  }

  // 单个选择
  const handleSelectSpot = (spotId: string) => {
    setSelectedSpotIds(prev => {
      if (prev.includes(spotId)) {
        const newSelected = prev.filter(id => id !== spotId)
        if (newSelected.length === 0) setSelectAll(false)
        return newSelected
      } else {
        const newSelected = [...prev, spotId]
        if (newSelected.length === paginatedSpots.length) setSelectAll(true)
        return newSelected
      }
    })
  }

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedSpotIds.length === 0) {
      toast.error('请至少选择一个景点')
      return
    }

    if (!confirm(`确定要删除选中的 ${selectedSpotIds.length} 个景点吗？此操作不可恢复。`)) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const deletePromises = selectedSpotIds.map(spotId =>
        fetch(`/api/admin/spots/${spotId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      )

      const results = await Promise.all(deletePromises)
      const failedCount = results.filter(r => !r.ok).length

      if (failedCount === 0) {
        toast.success(`成功删除 ${selectedSpotIds.length} 个景点`)
      } else {
        toast.warning(`删除完成，但有 ${failedCount} 个景点删除失败`)
      }

      setSelectedSpotIds([])
      setSelectAll(false)
      fetchSpots()
    } catch (error) {
      console.error('Error deleting spots:', error)
      toast.error('批量删除失败')
    }
  }

  // 批量修改状态
  const handleBatchStatusChange = async (newStatus: string) => {
    if (selectedSpotIds.length === 0) {
      toast.error('请至少选择一个景点')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const updatePromises = selectedSpotIds.map(spotId =>
        fetch(`/api/admin/spots/${spotId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ status: newStatus })
        })
      )

      const results = await Promise.all(updatePromises)
      const failedCount = results.filter(r => !r.ok).length

      if (failedCount === 0) {
        toast.success(`成功更新 ${selectedSpotIds.length} 个景点的状态`)
      } else {
        toast.warning(`更新完成，但有 ${failedCount} 个景点更新失败`)
      }

      setSelectedSpotIds([])
      setSelectAll(false)
      fetchSpots()
    } catch (error) {
      console.error('Error updating spot status:', error)
      toast.error('批量更新失败')
    }
  }

  const handleToggleRecommended = async (spotId: string, currentStatus: number) => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/admin/spots/${spotId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          is_recommended: currentStatus === 1 ? 0 : 1
        })
      })

      if (!res.ok) throw new Error('Failed to update status')

      setSpots(spots.map(s =>
        s.id === spotId ? { ...s, is_recommended: currentStatus === 1 ? 0 : 1 } : s
      ))
    } catch (error) {
      toast.error('更新推荐状态失败')
    }
  }

  const filteredSpots = spots.filter(spot => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return (
        spot.name.toLowerCase().includes(searchLower) ||
        spot.location.toLowerCase().includes(searchLower)
      )
    }
    return true
  })

  // 分页逻辑
  const totalPages = Math.ceil(filteredSpots.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedSpots = filteredSpots.slice(startIndex, endIndex)

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">景点管理</h1>
        <div className="text-center py-12">加载中...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">景点管理</h1>
          <p className="text-muted-foreground">管理所有景点信息</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingSpot(null)
              setFormData({
                name: '',
                description: '',
                location: '',
                price: '',
                category_id: '',
                is_recommended: false,
                images: [''],
                status: 'active'
              })
            }}>
              <Plus className="h-4 w-4 mr-2" />
              添加景点
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>{editingSpot ? '编辑景点' : '添加新景点'}</DialogTitle>
              <DialogDescription>
                {editingSpot ? '修改景点信息' : '创建一个新的景点'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    景点名称
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="category_id" className="text-right">
                    分类
                  </Label>
                  <div className="col-span-3">
                    <Select
                      value={formData.category_id}
                      onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="选择分类" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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
                    所在城市
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
                  <Label htmlFor="price" className="text-right">
                    参考价格
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="col-span-3"
                    required
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
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">推荐景点</Label>
                  <div className="col-span-3">
                    <input
                      type="checkbox"
                      checked={formData.is_recommended}
                      onChange={(e) => setFormData({ ...formData, is_recommended: e.target.checked })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">
                  {editingSpot ? '更新' : '创建'}
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
                  placeholder="搜索景点名称或地址"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="分类筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部分类</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.name}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

      {/* 景点列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>景点列表 ({filteredSpots.length})</CardTitle>
            {selectedSpotIds.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  已选择 {selectedSpotIds.length} 项
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
                <TableHead>景点</TableHead>
                <TableHead>位置</TableHead>
                <TableHead>分类</TableHead>
                <TableHead>价格</TableHead>
                <TableHead>评分</TableHead>
                <TableHead>浏览量</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedSpots.map((spot) => (
                <TableRow key={spot.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedSpotIds.includes(spot.id)}
                      onCheckedChange={() => handleSelectSpot(spot.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {spot.images?.[0] && (
                        <div className="relative w-16 h-16">
                          <Image
                            src={spot.images[0]}
                            alt={spot.name}
                            fill
                            className="object-cover rounded"
                          />
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{spot.name}</p>
                        {spot.is_recommended === 1 && (
                          <Badge variant="secondary" className="text-xs">
                            推荐
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{spot.location}</p>
                    </div>
                  </TableCell>
                  <TableCell>{spot.category_name}</TableCell>
                  <TableCell>¥{spot.price}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>{spot.rating.toFixed(1)}</span>
                    </div>
                  </TableCell>
                  <TableCell>{spot.view_count}</TableCell>
                  <TableCell>
                    <Badge variant={spot.status === 'active' ? 'default' : 'secondary'}>
                      {spot.status === 'active' ? '上架' : '下架'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(spot.id, spot.status)}
                        title={spot.status === 'active' ? '下架' : '上架'}
                      >
                        <Power className={`h-4 w-4 ${spot.status === 'active' ? 'text-green-600' : 'text-gray-400'}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleRecommended(spot.id, spot.is_recommended)}
                      >
                        <Star className={`h-4 w-4 ${spot.is_recommended === 1 ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(spot)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(spot.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredSpots.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              暂无景点数据
            </div>
          )}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            totalItems={filteredSpots.length}
          />
        </CardContent>
      </Card>
    </div>
  )
}