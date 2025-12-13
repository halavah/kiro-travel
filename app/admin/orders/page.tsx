'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Clock, CheckCircle2, XCircle, Package, Search, Eye } from "lucide-react"
import Link from "next/link"

interface Order {
  id: string
  order_no: string
  total_amount: number
  status: 'pending' | 'paid' | 'cancelled' | 'completed'
  paid_at: string | null
  created_at: string
  username: string
  email: string
  item_count: number
}

const statusConfig = {
  pending: { label: '待支付', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  paid: { label: '已支付', color: 'bg-blue-100 text-blue-800', icon: CheckCircle2 },
  cancelled: { label: '已取消', color: 'bg-gray-100 text-gray-800', icon: XCircle },
  completed: { label: '已完成', color: 'bg-green-100 text-green-800', icon: Package }
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)

      const res = await fetch(`/api/admin/orders?${params}`)
      if (!res.ok) throw new Error('Failed to fetch orders')

      const data = await res.json()
      setOrders(data.orders || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [statusFilter])

  const filteredOrders = orders.filter(order => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return (
        order.order_no.toLowerCase().includes(searchLower) ||
        order.username?.toLowerCase().includes(searchLower) ||
        order.email?.toLowerCase().includes(searchLower)
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
        <h1 className="text-3xl font-bold">订单管理</h1>
        <div className="text-center py-12">加载中...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">订单管理</h1>
        <p className="text-muted-foreground">查看和管理所有用户订单</p>
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
                  placeholder="搜索订单号、用户名或邮箱"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="订单状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="pending">待支付</SelectItem>
                <SelectItem value="paid">已支付</SelectItem>
                <SelectItem value="completed">已完成</SelectItem>
                <SelectItem value="cancelled">已取消</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 订单列表 */}
      <Card>
        <CardHeader>
          <CardTitle>订单列表 ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>订单号</TableHead>
                <TableHead>用户</TableHead>
                <TableHead>金额</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>下单时间</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => {
                const StatusIcon = statusConfig[order.status].icon
                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono">{order.order_no}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{order.username || '未知用户'}</p>
                        <p className="text-sm text-muted-foreground">{order.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">¥{order.total_amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge className={statusConfig[order.status].color}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusConfig[order.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(order.created_at)}</TableCell>
                    <TableCell>
                      <Link href={`/admin/orders/${order.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          查看详情
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          {filteredOrders.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              暂无订单数据
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}