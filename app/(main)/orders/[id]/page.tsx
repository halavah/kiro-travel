'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Clock, CheckCircle2, XCircle, Package, CreditCard } from "lucide-react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

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
  items: OrderItem[]
}

const statusConfig = {
  pending: { label: '待支付', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  paid: { label: '已支付', color: 'bg-blue-100 text-blue-800', icon: CheckCircle2 },
  cancelled: { label: '已取消', color: 'bg-gray-100 text-gray-800', icon: XCircle },
  completed: { label: '已完成', color: 'bg-green-100 text-green-800', icon: Package }
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
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
      const res = await fetch(`/api/orders/${orderId}`)

      if (res.status === 401) {
        router.push('/login')
        return
      }

      if (res.status === 404) {
        router.push('/orders')
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

  const handlePayment = async () => {
    if (!orderId) return

    setActionLoading(true)
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'paid' })
      })

      if (!res.ok) {
        const error = await res.json()
        alert(error.error || 'Payment failed')
        return
      }

      alert('支付成功！')
      await fetchOrder()
    } catch (error) {
      console.error('Error processing payment:', error)
      alert('支付失败，请重试')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!orderId) return

    setActionLoading(true)
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE'
      })

      if (!res.ok) {
        const error = await res.json()
        alert(error.error || 'Cancellation failed')
        return
      }

      alert('订单已取消，库存已恢复')
      await fetchOrder()
    } catch (error) {
      console.error('Error cancelling order:', error)
      alert('取消订单失败，请重试')
    } finally {
      setActionLoading(false)
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">加载中...</div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-12 text-center">
            <h2 className="text-2xl font-bold mb-2">订单不存在</h2>
            <p className="text-muted-foreground mb-6">该订单可能已被删除或您没有权限查看</p>
            <Button onClick={() => router.push('/orders')}>返回订单列表</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const StatusIcon = statusConfig[order.status].icon

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.push('/orders')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回订单列表
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 订单详情 */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>订单详情</CardTitle>
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

        {/* 订单操作 */}
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
                <span>实付金额</span>
                <span className="text-primary">¥{order.total_amount.toFixed(2)}</span>
              </div>

              <div className="space-y-2">
                {order.status === 'pending' && (
                  <>
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handlePayment}
                      disabled={actionLoading}
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      {actionLoading ? '处理中...' : '立即支付'}
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full"
                          disabled={actionLoading}
                        >
                          取消订单
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>确认取消订单？</AlertDialogTitle>
                          <AlertDialogDescription>
                            取消订单后，商品库存将会恢复，订单状态将变为已取消。此操作不可撤销。
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>再想想</AlertDialogCancel>
                          <AlertDialogAction onClick={handleCancel}>
                            确认取消
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}

                {order.status === 'paid' && (
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                    <p className="text-sm text-blue-800">订单已支付成功</p>
                  </div>
                )}

                {order.status === 'cancelled' && (
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <XCircle className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                    <p className="text-sm text-gray-800">订单已取消</p>
                  </div>
                )}

                {order.status === 'completed' && (
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <Package className="w-8 h-8 mx-auto mb-2 text-green-600" />
                    <p className="text-sm text-green-800">订单已完成</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
