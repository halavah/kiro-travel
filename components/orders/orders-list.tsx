"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import useSWR from "swr"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { FileText, Loader2, CreditCard, X } from "lucide-react"
import type { Order } from "@/lib/types"
import { toast } from "sonner"

const statusMap = {
  pending: { label: "待支付", variant: "secondary" as const },
  paid: { label: "已支付", variant: "default" as const },
  cancelled: { label: "已取消", variant: "destructive" as const },
  completed: { label: "已完成", variant: "outline" as const },
}

const fetcher = (url: string) => {
  const token = localStorage.getItem('token')
  if (!token) {
    throw new Error('未登录')
  }
  return fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }).then(r => {
    if (!r.ok) throw new Error('获取订单失败')
    return r.json()
  })
}

export function OrdersList() {
  const router = useRouter()
  const { data, error, isLoading, mutate } = useSWR('/api/orders', fetcher)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const orders: Order[] = data?.orders || []

  const handlePay = async (orderId: string) => {
    setLoadingId(orderId)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/orders/${orderId}/pay`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('支付失败')

      mutate()
      toast.success("支付成功")
    } catch (error) {
      toast.error("支付失败")
      console.error(error)
    } finally {
      setLoadingId(null)
    }
  }

  const handleCancel = async (orderId: string) => {
    setLoadingId(orderId)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('取消失败')

      mutate()
      toast.success("订单已取消")
    } catch (error) {
      toast.error("取消失败")
      console.error(error)
    } finally {
      setLoadingId(null)
    }
  }

  // 加载状态
  if (isLoading) {
    return (
      <div className="text-center py-16">
        <Loader2 className="h-16 w-16 mx-auto mb-4 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground">加载订单中...</p>
      </div>
    )
  }

  // 错误状态
  if (error) {
    return (
      <div className="text-center py-16">
        <Card>
          <CardContent className="p-8">
            <FileText className="h-16 w-16 mx-auto mb-4 opacity-50 text-destructive" />
            <p className="text-lg font-semibold mb-2">加载失败</p>
            <p className="text-sm text-muted-foreground mb-4">{error.message || '无法获取订单数据'}</p>
            <Button onClick={() => mutate()} variant="outline">
              重试
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 空订单状态
  if (orders.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-muted-foreground">
          <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">暂无订单记录</p>
          <p className="text-sm mt-2">去购买门票开启您的旅程吧</p>
          <Link href="/tickets">
            <Button className="mt-6">浏览门票</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <Card key={order.id}>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">订单号：{order.order_no}</span>
                <Badge variant={statusMap[order.status].variant}>{statusMap[order.status].label}</Badge>
              </div>
              <span className="text-sm text-muted-foreground">
                {new Date(order.created_at).toLocaleString("zh-CN")}
              </span>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="py-4">
            <div className="space-y-3">
              {order.items?.map((item) => (
                <div key={item.id} className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">{item.spot_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {item.ticket_name} × {item.quantity}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">¥{(item.price * item.quantity).toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <Separator />
          <CardFooter className="justify-between py-4">
            <div>
              <span className="text-muted-foreground">
                共 {order.items?.reduce((sum, i) => sum + i.quantity, 0) || 0} 件
              </span>
              <span className="mx-2 text-muted-foreground">|</span>
              <span className="text-muted-foreground">合计：</span>
              <span className="text-xl font-bold text-primary">¥{order.total_amount.toFixed(2)}</span>
            </div>
            <div className="flex gap-2">
              {order.status === "pending" && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCancel(order.id)}
                    disabled={loadingId === order.id}
                  >
                    {loadingId === order.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4 mr-1" />
                    )}
                    取消订单
                  </Button>
                  <Button size="sm" onClick={() => handlePay(order.id)} disabled={loadingId === order.id}>
                    {loadingId === order.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CreditCard className="h-4 w-4 mr-1" />
                    )}
                    立即支付
                  </Button>
                </>
              )}
              <Link href={`/orders/${order.id}`}>
                <Button variant="ghost" size="sm">
                  查看详情
                </Button>
              </Link>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
