'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Calendar, Users, Clock, MapPin, Ticket, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface OrderDetail {
  id: string
  order_no: string
  total_amount: number
  status: 'pending' | 'paid' | 'cancelled' | 'completed'
  paid_at?: string
  created_at: string
  note?: string
  items: {
    id: string
    ticket_name: string
    spot_name: string
    price: number
    quantity: number
    created_at: string
  }[]
}

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)

  const orderId = params.id as string

  useEffect(() => {
    fetchOrder()
  }, [orderId])

  const fetchOrder = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const res = await fetch(`/api/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!res.ok) {
        if (res.status === 404) {
          toast.error('订单不存在')
        } else if (res.status === 403) {
          toast.error('无权查看此订单')
        } else {
          throw new Error('获取订单详情失败')
        }
        router.push('/orders')
        return
      }

      const data = await res.json()
      setOrder(data.order)
    } catch (error) {
      console.error('Error fetching order:', error)
      toast.error('获取订单详情失败')
      router.push('/orders')
    } finally {
      setLoading(false)
    }
  }

  const handlePay = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/orders/${orderId}/pay`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!res.ok) {
        throw new Error('支付失败')
      }

      toast.success('支付成功')
      fetchOrder() // 重新获取订单状态
    } catch (error: any) {
      console.error('Error paying order:', error)
      toast.error(error.message || '支付失败')
    }
  }

  const handleCancel = async () => {
    if (!confirm('确定要取消这个订单吗？')) return

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!res.ok) {
        throw new Error('取消订单失败')
      }

      toast.success('订单已取消')
      fetchOrder() // 重新获取订单状态
    } catch (error: any) {
      console.error('Error cancelling order:', error)
      toast.error(error.message || '取消订单失败')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">待支付</Badge>
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">已支付</Badge>
      case 'cancelled':
        return <Badge variant="destructive">已取消</Badge>
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800">已完成</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">加载中...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg">订单不存在</p>
          <Link href="/orders" className="inline-flex items-center gap-1 text-primary hover:underline mt-4">
            返回订单列表
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Link
          href="/orders"
          className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          返回订单列表
        </Link>
      </div>

      <div className="space-y-6">
        {/* 订单状态 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon(order.status)}
                订单详情
              </CardTitle>
              {getStatusBadge(order.status)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">订单号：</span>
                <span className="font-mono">{order.order_no}</span>
              </div>
              <div>
                <span className="text-muted-foreground">下单时间：</span>
                <span>{new Date(order.created_at).toLocaleString('zh-CN')}</span>
              </div>
              {order.paid_at && (
                <div>
                  <span className="text-muted-foreground">支付时间：</span>
                  <span>{new Date(order.paid_at).toLocaleString('zh-CN')}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 订单项 */}
        <Card>
          <CardHeader>
            <CardTitle>订单商品</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex-shrink-0">
                    <Ticket className="h-10 w-10 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.ticket_name}</h3>
                    <p className="text-sm text-muted-foreground">{item.spot_name}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">¥{item.price} × {item.quantity}</div>
                    <div className="font-semibold">¥{item.price * item.quantity}</div>
                  </div>
                </div>
              ))}
            </div>
            <Separator className="my-4" />
            <div className="flex justify-between text-lg font-bold">
              <span>订单总额：</span>
              <span className="text-primary">¥{order.total_amount}</span>
            </div>
          </CardContent>
        </Card>

        {/* 预订信息（如果有） */}
        {order.note && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">预订信息</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <div className="whitespace-pre-line">{order.note}</div>
            </CardContent>
          </Card>
        )}

        {/* 温馨提示 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">温馨提示</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            {order.status === 'pending' && (
              <p>• 请在订单创建后24小时内完成支付，逾期订单将自动取消</p>
            )}
            <p>• 支付成功后，您将收到订单确认邮件</p>
            <p>• 请凭订单号和有效身份证件入园</p>
            <p>• 如有疑问，请联系客服：400-123-4567</p>
          </CardContent>
        </Card>

        {/* 操作按钮 */}
        {(order.status === 'pending' || order.status === 'paid') && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-3">
                {order.status === 'pending' && (
                  <>
                    <Button onClick={handlePay} className="flex-1">
                      立即支付
                    </Button>
                    <Button variant="outline" onClick={handleCancel}>
                      取消订单
                    </Button>
                  </>
                )}
                {order.status === 'paid' && (
                  <Button className="flex-1" disabled>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    已完成支付
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
