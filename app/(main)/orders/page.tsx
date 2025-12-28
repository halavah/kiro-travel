'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ShoppingBag, Clock, CheckCircle2, XCircle, Package } from "lucide-react"

interface Order {
  id: string
  order_no: string
  total_amount: number
  status: 'pending' | 'paid' | 'cancelled' | 'completed'
  paid_at: string | null
  created_at: string
  item_count: number
}

const statusConfig = {
  pending: { label: '待支付', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  paid: { label: '已支付', color: 'bg-blue-100 text-blue-800', icon: CheckCircle2 },
  cancelled: { label: '已取消', color: 'bg-gray-100 text-gray-800', icon: XCircle },
  completed: { label: '已完成', color: 'bg-green-100 text-green-800', icon: Package }
}

export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')

  const fetchOrders = async (status: string = 'all') => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const url = status === 'all' ? '/api/orders' : `/api/orders?status=${status}`
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (res.status === 401) {
        router.push('/login')
        return
      }

      if (!res.ok) {
        throw new Error('Failed to fetch orders')
      }

      const data = await res.json()
      setOrders(data.orders)
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders(activeTab)
  }, [activeTab, router])

  const handleViewOrder = (orderId: string) => {
    router.push(`/orders/${orderId}`)
  }

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
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">加载中...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="w-6 h-6" />
            我的订单
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">全部</TabsTrigger>
              <TabsTrigger value="pending">待支付</TabsTrigger>
              <TabsTrigger value="paid">已支付</TabsTrigger>
              <TabsTrigger value="completed">已完成</TabsTrigger>
              <TabsTrigger value="cancelled">已取消</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {orders.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">暂无订单</h3>
                  <p className="text-muted-foreground mb-6">
                    {activeTab === 'all' ? '您还没有任何订单' : `您没有${statusConfig[activeTab as keyof typeof statusConfig]?.label}的订单`}
                  </p>
                  <Button onClick={() => router.push('/spots')}>
                    去逛逛
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => {
                    const StatusIcon = statusConfig[order.status].icon
                    return (
                      <Card key={order.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <span className="font-mono text-sm text-muted-foreground">
                                  订单号: {order.order_no}
                                </span>
                                <Badge className={statusConfig[order.status].color}>
                                  <StatusIcon className="w-3 h-3 mr-1" />
                                  {statusConfig[order.status].label}
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                下单时间: {formatDate(order.created_at)}
                              </div>
                              {order.paid_at && (
                                <div className="text-sm text-muted-foreground">
                                  支付时间: {formatDate(order.paid_at)}
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-primary">
                                ¥{order.total_amount.toFixed(2)}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                共 {order.item_count} 件商品
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              onClick={() => handleViewOrder(order.id)}
                            >
                              查看详情
                            </Button>
                            {order.status === 'pending' && (
                              <Button onClick={() => handleViewOrder(order.id)}>
                                去支付
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
