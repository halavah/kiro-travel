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
import { Search, Plus, Edit, Trash2, Star, MapPin, Phone, Power } from "lucide-react"
import { toast } from "sonner"
import Image from 'next/image'
import MultiImageUpload from '@/components/admin/MultiImageUpload'
import Pagination from '@/components/admin/Pagination'
import { Checkbox } from "@/components/ui/checkbox"

interface Hotel {
  id: string
  name: string
  description: string
  location: string
  address: string
  rating: number
  amenities: string[]
  images: string[]
  phone: string
  status: 'active' | 'inactive'
  created_at: string
}

export default function AdminHotelsPage() {
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingHotel, setEditingHotel] = useState<Hotel | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [selectedHotelIds, setSelectedHotelIds] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    address: '',
    rating: '5',
    amenities: [] as string[],
    images: [] as string[],
    phone: '',
    status: 'active' as 'active' | 'inactive'
  })

  const fetchHotels = async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      const token = localStorage.getItem('token')

      const res = await fetch(`/api/admin/hotels?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!res.ok) throw new Error('Failed to fetch hotels')

      const data = await res.json()
      setHotels(data.hotels || [])
      setCurrentPage(1) // 重置到第一页
    } catch (error) {
      console.error('Error fetching hotels:', error)
      toast.error('获取酒店列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHotels()
  }, [statusFilter])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const token = localStorage.getItem('token')
      const url = editingHotel ? `/api/admin/hotels/${editingHotel.id}` : '/api/admin/hotels'
      const method = editingHotel ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          rating: parseFloat(formData.rating)
        })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || '操作失败')
      }

      toast.success(editingHotel ? '酒店更新成功' : '酒店创建成功')
      setIsAddDialogOpen(false)
      setEditingHotel(null)
      setFormData({
        name: '',
        description: '',
        location: '',
        address: '',
        rating: '5',
        amenities: [],
        images: [],
        phone: '',
        status: 'active'
      })
      fetchHotels()
    } catch (error: any) {
      toast.error(error.message || '操作失败')
    }
  }

  const handleEdit = (hotel: Hotel) => {
    setEditingHotel(hotel)
    setFormData({
      name: hotel.name,
      description: hotel.description,
      location: hotel.location,
      address: hotel.address,
      rating: hotel.rating.toString(),
      amenities: hotel.amenities || [],
      images: hotel.images && hotel.images.length > 0 ? hotel.images : [''],
      phone: hotel.phone,
      status: hotel.status
    })
    setIsAddDialogOpen(true)
  }

  const handleDelete = async (hotelId: string) => {
    if (!confirm('确定要删除这个酒店吗？')) return

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/admin/hotels/${hotelId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || '删除失败')
      }

      toast.success('酒店删除成功')
      fetchHotels()
    } catch (error: any) {
      toast.error(error.message || '删除失败')
    }
  }

  const handleToggleStatus = async (hotelId: string, currentStatus: 'active' | 'inactive') => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    const statusText = newStatus === 'active' ? '上架' : '下架'

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/admin/hotels/${hotelId}`, {
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

      toast.success(`酒店已${statusText}`)
      fetchHotels()
    } catch (error: any) {
      toast.error(error.message || '状态更新失败')
    }
  }

  // 全选/取消全选
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedHotelIds([])
      setSelectAll(false)
    } else {
      setSelectedHotelIds(paginatedHotels.map(hotel => hotel.id))
      setSelectAll(true)
    }
  }

  // 单个选择
  const handleSelectHotel = (hotelId: string) => {
    setSelectedHotelIds(prev => {
      if (prev.includes(hotelId)) {
        const newSelected = prev.filter(id => id !== hotelId)
        if (newSelected.length === 0) setSelectAll(false)
        return newSelected
      } else {
        const newSelected = [...prev, hotelId]
        if (newSelected.length === paginatedHotels.length) setSelectAll(true)
        return newSelected
      }
    })
  }

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedHotelIds.length === 0) {
      toast.error('请至少选择一个酒店')
      return
    }

    if (!confirm(`确定要删除选中的 ${selectedHotelIds.length} 个酒店吗？此操作不可恢复。`)) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const deletePromises = selectedHotelIds.map(hotelId =>
        fetch(`/api/admin/hotels/${hotelId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      )

      const results = await Promise.all(deletePromises)
      const failedCount = results.filter(r => !r.ok).length

      if (failedCount === 0) {
        toast.success(`成功删除 ${selectedHotelIds.length} 个酒店`)
      } else {
        toast.warning(`删除完成，但有 ${failedCount} 个酒店删除失败`)
      }

      setSelectedHotelIds([])
      setSelectAll(false)
      fetchHotels()
    } catch (error) {
      console.error('Error deleting hotels:', error)
      toast.error('批量删除失败')
    }
  }

  // 批量修改状态
  const handleBatchStatusChange = async (newStatus: string) => {
    if (selectedHotelIds.length === 0) {
      toast.error('请至少选择一个酒店')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const updatePromises = selectedHotelIds.map(hotelId =>
        fetch(`/api/admin/hotels/${hotelId}`, {
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
        toast.success(`成功更新 ${selectedHotelIds.length} 个酒店的状态`)
      } else {
        toast.warning(`更新完成，但有 ${failedCount} 个酒店更新失败`)
      }

      setSelectedHotelIds([])
      setSelectAll(false)
      fetchHotels()
    } catch (error) {
      console.error('Error updating hotel status:', error)
      toast.error('批量更新失败')
    }
  }

  const handleAddFacility = () => {
    setFormData({
      ...formData,
      amenities: [...formData.amenities, '']
    })
  }

  const handleUpdateFacility = (index: number, value: string) => {
    const newFacilities = [...formData.amenities]
    newFacilities[index] = value
    setFormData({
      ...formData,
      amenities: newFacilities
    })
  }

  const handleRemoveFacility = (index: number) => {
    setFormData({
      ...formData,
      amenities: formData.amenities.filter((_, i) => i !== index)
    })
  }

  const filteredHotels = hotels.filter(hotel => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return (
        hotel.name.toLowerCase().includes(searchLower) ||
        hotel.location.toLowerCase().includes(searchLower) ||
        hotel.address.toLowerCase().includes(searchLower)
      )
    }
    return true
  })

  // 分页逻辑
  const totalPages = Math.ceil(filteredHotels.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedHotels = filteredHotels.slice(startIndex, endIndex)

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">酒店管理</h1>
        <div className="text-center py-12">加载中...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">酒店管理</h1>
          <p className="text-muted-foreground">管理所有酒店信息</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingHotel(null)
              setFormData({
                name: '',
                description: '',
                location: '',
                address: '',
                rating: '5',
                amenities: [],
                images: [''],
                phone: '',
                status: 'active'
              })
            }}>
              <Plus className="h-4 w-4 mr-2" />
              添加酒店
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>{editingHotel ? '编辑酒店' : '添加新酒店'}</DialogTitle>
              <DialogDescription>
                {editingHotel ? '修改酒店信息' : '创建一个新的酒店'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    酒店名称
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                  <Label htmlFor="address" className="text-right">
                    详细地址
                  </Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="rating" className="text-right">
                    评级
                  </Label>
                  <div className="col-span-3">
                    <Select
                      value={formData.rating}
                      onValueChange={(value) => setFormData({ ...formData, rating: value })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="选择评级" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">五星 (5.0)</SelectItem>
                        <SelectItem value="4.9">4.9</SelectItem>
                        <SelectItem value="4.8">4.8</SelectItem>
                        <SelectItem value="4.7">4.7</SelectItem>
                        <SelectItem value="4.6">4.6</SelectItem>
                        <SelectItem value="4.5">四星半 (4.5)</SelectItem>
                        <SelectItem value="4.4">4.4</SelectItem>
                        <SelectItem value="4.3">4.3</SelectItem>
                        <SelectItem value="4.2">4.2</SelectItem>
                        <SelectItem value="4.1">4.1</SelectItem>
                        <SelectItem value="4">四星 (4.0)</SelectItem>
                        <SelectItem value="3.9">3.9</SelectItem>
                        <SelectItem value="3.8">3.8</SelectItem>
                        <SelectItem value="3.7">3.7</SelectItem>
                        <SelectItem value="3.6">3.6</SelectItem>
                        <SelectItem value="3.5">三星半 (3.5)</SelectItem>
                        <SelectItem value="3">三星 (3.0)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="phone" className="text-right">
                    联系电话
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label className="text-right pt-2">设施服务</Label>
                  <div className="col-span-3 space-y-2">
                    {formData.amenities.map((facility, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={facility}
                          onChange={(e) => handleUpdateFacility(index, e.target.value)}
                          placeholder="例如：免费WiFi、停车场、游泳池"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleRemoveFacility(index)}
                        >
                          删除
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddFacility}
                    >
                      添加设施
                    </Button>
                  </div>
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
                  {editingHotel ? '更新' : '创建'}
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
                  placeholder="搜索酒店名称或地址"
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

      {/* 酒店列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>酒店列表 ({filteredHotels.length})</CardTitle>
            {selectedHotelIds.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  已选择 {selectedHotelIds.length} 项
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
                <TableHead>酒店</TableHead>
                <TableHead>位置</TableHead>
                <TableHead>评级</TableHead>
                <TableHead>联系方式</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedHotels.map((hotel) => (
                <TableRow key={hotel.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedHotelIds.includes(hotel.id)}
                      onCheckedChange={() => handleSelectHotel(hotel.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {hotel.images?.[0] && (
                        <div className="relative w-16 h-16">
                          <Image
                            src={hotel.images[0]}
                            alt={hotel.name}
                            fill
                            className="object-cover rounded"
                          />
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{hotel.name}</p>
                        <div className="flex gap-1 mt-1">
                          {hotel.amenities?.slice(0, 2).map((facility, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {facility}
                            </Badge>
                          ))}
                          {(hotel.amenities?.length || 0) > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{(hotel.amenities?.length || 0) - 2}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{hotel.location}</p>
                      <p className="text-muted-foreground">{hotel.address}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>{hotel.rating}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {hotel.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          <span>{hotel.phone}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={hotel.status === 'active' ? 'default' : 'secondary'}>
                      {hotel.status === 'active' ? '上架' : '下架'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(hotel.id, hotel.status)}
                        title={hotel.status === 'active' ? '下架' : '上架'}
                      >
                        <Power className={`h-4 w-4 ${hotel.status === 'active' ? 'text-green-600' : 'text-gray-400'}`} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(hotel)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(hotel.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredHotels.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              暂无酒店数据
            </div>
          )}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            totalItems={filteredHotels.length}
          />
        </CardContent>
      </Card>
    </div>
  )
}