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
import { Search, Plus, Edit, Trash2, Eye, Power } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import Pagination from '@/components/admin/Pagination'
import { Checkbox } from "@/components/ui/checkbox"

interface Ticket {
  id: string
  name: string
  description: string
  price: number
  stock: number
  status: 'active' | 'inactive'
  valid_from: string
  valid_to: string
  spot_id: string
  spot_name: string
  spot_location: string
  sold_count: number
}

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    spot_id: '',
    valid_from: '',
    valid_to: '',
    status: 'active' as 'active' | 'inactive'
  })
  const [spots, setSpots] = useState<any[]>([])

  const fetchTickets = async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      const token = localStorage.getItem('token')

      const res = await fetch(`/api/admin/tickets?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!res.ok) throw new Error('Failed to fetch tickets')

      const data = await res.json()
      setTickets(data.tickets || [])
      setCurrentPage(1) // 重置到第一页
    } catch (error) {
      console.error('Error fetching tickets:', error)
      toast.error('获取门票列表失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchSpots = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/admin/spots', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!res.ok) throw new Error('Failed to fetch spots')

      const data = await res.json()
      setSpots(data.spots || [])
    } catch (error) {
      console.error('Error fetching spots:', error)
    }
  }

  useEffect(() => {
    fetchTickets()
    fetchSpots()
  }, [statusFilter])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const token = localStorage.getItem('token')
      const url = editingTicket ? `/api/admin/tickets/${editingTicket.id}` : '/api/admin/tickets'
      const method = editingTicket ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock)
        })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || '操作失败')
      }

      toast.success(editingTicket ? '门票更新成功' : '门票创建成功')
      setIsAddDialogOpen(false)
      setEditingTicket(null)
      setFormData({
        name: '',
        description: '',
        price: '',
        stock: '',
        spot_id: '',
        valid_from: '',
        valid_to: '',
        status: 'active'
      })
      fetchTickets()
    } catch (error: any) {
      toast.error(error.message || '操作失败')
    }
  }

  const handleEdit = (ticket: Ticket) => {
    setEditingTicket(ticket)
    setFormData({
      name: ticket.name,
      description: ticket.description,
      price: ticket.price.toString(),
      stock: ticket.stock.toString(),
      spot_id: ticket.spot_id,
      valid_from: ticket.valid_from,
      valid_to: ticket.valid_to,
      status: ticket.status
    })
    setIsAddDialogOpen(true)
  }

  const handleDelete = async (ticketId: string) => {
    if (!confirm('确定要删除这个门票吗？')) return

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/admin/tickets/${ticketId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || '删除失败')
      }

      toast.success('门票删���成功')
      fetchTickets()
    } catch (error: any) {
      toast.error(error.message || '删除失败')
    }
  }

  const handleToggleStatus = async (ticketId: string, currentStatus: 'active' | 'inactive') => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    const statusText = newStatus === 'active' ? '上架' : '下架'

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/admin/tickets/${ticketId}`, {
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

      toast.success(`门票已${statusText}`)
      fetchTickets()
    } catch (error: any) {
      toast.error(error.message || '状态更新失败')
    }
  }

  // 全选/取消全选
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedTicketIds([])
      setSelectAll(false)
    } else {
      setSelectedTicketIds(paginatedTickets.map(ticket => ticket.id))
      setSelectAll(true)
    }
  }

  // 单个选择
  const handleSelectTicket = (ticketId: string) => {
    setSelectedTicketIds(prev => {
      if (prev.includes(ticketId)) {
        const newSelected = prev.filter(id => id !== ticketId)
        if (newSelected.length === 0) setSelectAll(false)
        return newSelected
      } else {
        const newSelected = [...prev, ticketId]
        if (newSelected.length === paginatedTickets.length) setSelectAll(true)
        return newSelected
      }
    })
  }

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedTicketIds.length === 0) {
      toast.error('请至少选择一个门票')
      return
    }

    if (!confirm(`确定要删除选中的 ${selectedTicketIds.length} 个门票吗？此操作不可恢复。`)) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const deletePromises = selectedTicketIds.map(ticketId =>
        fetch(`/api/admin/tickets/${ticketId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      )

      const results = await Promise.all(deletePromises)
      const failedCount = results.filter(r => !r.ok).length

      if (failedCount === 0) {
        toast.success(`成功删除 ${selectedTicketIds.length} 个门票`)
      } else {
        toast.warning(`删除完成，但有 ${failedCount} 个门票删除失败`)
      }

      setSelectedTicketIds([])
      setSelectAll(false)
      fetchTickets()
    } catch (error) {
      console.error('Error deleting tickets:', error)
      toast.error('批量删除失败')
    }
  }

  // 批量修改状态
  const handleBatchStatusChange = async (newStatus: string) => {
    if (selectedTicketIds.length === 0) {
      toast.error('请至少选择一个门票')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const updatePromises = selectedTicketIds.map(ticketId =>
        fetch(`/api/admin/tickets/${ticketId}`, {
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
        toast.success(`成功更新 ${selectedTicketIds.length} 个门票的状态`)
      } else {
        toast.warning(`更新完成，但有 ${failedCount} 个门票更新失败`)
      }

      setSelectedTicketIds([])
      setSelectAll(false)
      fetchTickets()
    } catch (error) {
      console.error('Error updating ticket status:', error)
      toast.error('批量更新失败')
    }
  }

  const filteredTickets = tickets.filter(ticket => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return (
        ticket.name.toLowerCase().includes(searchLower) ||
        ticket.spot_name.toLowerCase().includes(searchLower) ||
        ticket.spot_location.toLowerCase().includes(searchLower)
      )
    }
    return true
  })

  // 分页逻辑
  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedTickets = filteredTickets.slice(startIndex, endIndex)

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">门票管理</h1>
        <div className="text-center py-12">加载中...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">门票管理</h1>
          <p className="text-muted-foreground">管理所有景点门票信息</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingTicket(null)}>
              <Plus className="h-4 w-4 mr-2" />
              添加门票
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingTicket ? '编辑门票' : '添加新门票'}</DialogTitle>
              <DialogDescription>
                {editingTicket ? '修改门票信息' : '创建一个新的景点门票'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    门票名称
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
                  <Label htmlFor="spot_id" className="text-right">
                    所属景点
                  </Label>
                  <div className="col-span-3">
                    <Select
                      value={formData.spot_id}
                      onValueChange={(value) => setFormData({ ...formData, spot_id: value })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="选择景点" />
                      </SelectTrigger>
                      <SelectContent>
                        {spots.map((spot) => (
                          <SelectItem key={spot.id} value={spot.id}>
                            {spot.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
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
                  <Label htmlFor="price" className="text-right">
                    价格
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
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="stock" className="text-right">
                    库存
                  </Label>
                  <Input
                    id="stock"
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="valid_from" className="text-right">
                    有效期开始
                  </Label>
                  <Input
                    id="valid_from"
                    type="date"
                    value={formData.valid_from}
                    onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="valid_to" className="text-right">
                    有效期结束
                  </Label>
                  <Input
                    id="valid_to"
                    type="date"
                    value={formData.valid_to}
                    onChange={(e) => setFormData({ ...formData, valid_to: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="status" className="text-right">
                    状态
                  </Label>
                  <div className="col-span-3">
                    <Select
                      value={formData.status}
                      onValueChange={(value: 'active' | 'inactive') => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">上架</SelectItem>
                        <SelectItem value="inactive">下架</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">
                  {editingTicket ? '更新' : '创建'}
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
                  placeholder="搜索门票名称或景点"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
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

      {/* 门票列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>门票列表 ({filteredTickets.length})</CardTitle>
            {selectedTicketIds.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  已选择 {selectedTicketIds.length} 项
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
                <TableHead>门票名称</TableHead>
                <TableHead>景点</TableHead>
                <TableHead>价格</TableHead>
                <TableHead>库存/已售</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>有效期</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedTicketIds.includes(ticket.id)}
                      onCheckedChange={() => handleSelectTicket(ticket.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{ticket.name}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{ticket.spot_name}</p>
                      <p className="text-sm text-muted-foreground">{ticket.spot_location}</p>
                    </div>
                  </TableCell>
                  <TableCell>¥{ticket.price.toFixed(2)}</TableCell>
                  <TableCell>
                    <span className={ticket.stock < 20 ? 'text-red-600' : ''}>
                      {ticket.stock} / {ticket.sold_count || 0}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={ticket.status === 'active' ? 'default' : 'secondary'}>
                      {ticket.status === 'active' ? '上架' : '下架'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{ticket.valid_from || '不限'}</div>
                      <div>{ticket.valid_to || '不限'}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(ticket.id, ticket.status)}
                        title={ticket.status === 'active' ? '下架' : '上架'}
                      >
                        <Power className={`h-4 w-4 ${ticket.status === 'active' ? 'text-green-600' : 'text-gray-400'}`} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(ticket)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(ticket.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredTickets.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              暂无门票数据
            </div>
          )}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            totalItems={filteredTickets.length}
          />
        </CardContent>
      </Card>
    </div>
  )
}