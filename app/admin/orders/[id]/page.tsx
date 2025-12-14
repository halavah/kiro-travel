'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Clock, CheckCircle2, XCircle, Package, Mail, Phone } from "lucide-react"
import Link from "next/link"
import { toast } from 'sonner'

interface OrderItem {
  id: string
  ticket_name: string
  spot_name: string
  price: number
  quantity: number
}

interface Order {
  id: string
  order_no: string
  total_amount: number
  status: 'pending' | 'paid' | 'cancelled' | 'completed'
  paid_at: string | null
  created_at: string
  username: string
  email: string
  phone: string | null
  items: OrderItem[]
}

const statusConfig = {
  pending: { label: '待支付', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  paid: { label: '已支付', color: 'bg-blue-100 text-blue-800', icon: CheckCircle2 },
  cancelled: { label: '已取消', color: 'bg-gray-100 text-gray-800', icon: XCircle },
  completed: { label: '已完成', color: 'bg-green-100 text-green-800', icon: Package }
}

export default function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [orderId, setOrderId] = useState<string | null>(null)

  useEffect(() => {
    params.then(p => setOrderId(p.id))
  }, [params])

  useEffect(() => {
    if (orderId) {
      fetchOrder()
    }
  }, [orderId])

  const fetchOrder = async () => {
    if (!orderId) return

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (res.status === 401 || res.status === 403) {
        router.push('/admin')
        return
      }

      if (res.status === 404) {
        router.push('/admin/orders')
        return
      }

      if (!res.ok) {
        throw new Error('Failed to fetch order')
      }

      const data = await res.json()
      setOrder(data.order)
    } catch (error) {
      console.error('Error fetching order:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!orderId) return

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (!res.ok) {
        throw new Error('Failed to update order status')
      }

      toast.success('订单状态已更新')
      fetchOrder() // 重新获取订单信息
    } catch (error) {
      console.error('Error updating order status:', error)
      toast.error('更新订单状态失败')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">加载中...</div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-12 text-center">
            <h2 className="text-2xl font-bold mb-2">订单不存在</h2>
            <p className="text-muted-foreground mb-6">该订单可能已被删除</p>
            <Link href="/admin/orders">
              <Button>返回订单列表</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const StatusIcon = statusConfig[order.status].icon

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/orders">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回订单列表
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">订单详情</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 订单详情 */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>订单信息</CardTitle>
                <Badge className={statusConfig[order.status].color}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {statusConfig[order.status].label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">订单号:</span>
                  <div className="font-mono font-medium mt-1">{order.order_no}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">下单时间:</span>
                  <div className="font-medium mt-1">{formatDate(order.created_at)}</div>
                </div>
                {order.paid_at && (
                  <div>
                    <span className="text-muted-foreground">支付时间:</span>
                    <div className="font-medium mt-1">{formatDate(order.paid_at)}</div>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">订单状态:</span>
                  <div className="font-medium mt-1">{statusConfig[order.status].label}</div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-3">用户信息</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">用户名:</span>
                    <span>{order.username || '未设置'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{order.email}</span>
                  </div>
                  {order.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{order.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-3">订单商品</h3>
                <div className="space-y-3">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-start p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{item.ticket_name}</h4>
                        <p className="text-sm text-muted-foreground">{item.spot_name}</p>
                        <div className="mt-2 text-sm">
                          <span className="text-muted-foreground">单价: </span>
                          <span className="font-medium">¥{item.price.toFixed(2)}</span>
                          <span className="text-muted-foreground ml-4">数量: </span>
                          <span className="font-medium">×{item.quantity}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">
                          ¥{(item.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 订单摘要 */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>订单金额</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>商品总价</span>
                  <span>¥{order.total_amount.toFixed(2)}</span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between text-lg font-bold">
                <span>订单总额</span>
                <span className="text-primary">¥{order.total_amount.toFixed(2)}</span>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-3">修改订单状态</h3>
                <Select value={order.status} onValueChange={handleStatusChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">待支付</SelectItem>
                    <SelectItem value="paid">已支付</SelectItem>
                    <SelectItem value="completed">已完成</SelectItem>
                    <SelectItem value="cancelled">已取消</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-2">
                  选择新的订单状态来更新订单
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}