"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import useSWR from "swr"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, CheckCircle, Clock, XCircle, CreditCard, Loader2, FileText } from "lucide-react"
import type { Order } from "@/lib/types"
import { toast } from "sonner"

interface OrderDetailProps {
  orderId: string
}

const statusConfig = {
  pending: { label: "待支付", icon: Clock, color: "text-yellow-500", variant: "secondary" as const },
  paid: { label: "已支付", icon: CheckCircle, color: "text-green-500", variant: "default" as const },
  cancelled: { label: "已取消", icon: XCircle, color: "text-destructive", variant: "destructive" as const },
  completed: { label: "已完成", icon: CheckCircle, color: "text-primary", variant: "outline" as const },
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

export function OrderDetail({ orderId }: OrderDetailProps) {
  const router = useRouter()
  const { data, error, isLoading: dataLoading, mutate } = useSWR(`/api/orders/${orderId}`, fetcher)
  const [isLoading, setIsLoading] = useState(false)

  const order: Order | null = data?.order || null

  const handlePay = async () => {
    setIsLoading(true)

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
      toast.success("支付成功！门票已生效")
    } catch (error) {
      toast.error("支付失败")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = async () => {
    setIsLoading(true)

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
      setIsLoading(false)
    }
  }

  // 加载状态
  if (dataLoading) {
    return (
      <div className="text-center py-16">
        <Loader2 className="h-16 w-16 mx-auto mb-4 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground">加载订单详情中...</p>
      </div>
    )
  }

  // 错误状态
  if (error || !order) {
    return (
      <div className="text-center py-16">
        <Card>
          <CardContent className="p-8">
            <FileText className="h-16 w-16 mx-auto mb-4 opacity-50 text-destructive" />
            <p className="text-lg font-semibold mb-2">加载失败</p>
            <p className="text-sm text-muted-foreground mb-4">
              {error?.message || '无法获取订单详情'}
            </p>
            <Button onClick={() => mutate()} variant="outline">
              重试
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const status = statusConfig[order.status]
  const StatusIcon = status.icon

  return (
    <div className="space-y-6">
      <Link
        href="/orders"
        className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        返回订单列表
      </Link>

      <Card>
        <CardHeader className="text-center pb-2">
          <div className={`mx-auto mb-2 ${status.color}`}>
            <StatusIcon className="h-16 w-16" />
          </div>
          <Badge variant={status.variant} className="w-fit mx-auto">
            {status.label}
          </Badge>
          <CardTitle className="text-2xl mt-2">¥{order.total_amount.toFixed(2)}</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">订单号</span>
              <p className="font-medium mt-1">{order.order_no}</p>
            </div>
            <div>
              <span className="text-muted-foreground">创建时间</span>
              <p className="font-medium mt-1">{new Date(order.created_at).toLocaleString("zh-CN")}</p>
            </div>
            {order.paid_at && (
              <div>
                <span className="text-muted-foreground">支付时间</span>
                <p className="font-medium mt-1">{new Date(order.paid_at).toLocaleString("zh-CN")}</p>
              </div>
            )}
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              订单明细
            </h3>
            <div className="space-y-3">
              {order.items?.map((item) => (
                <div key={item.id} className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                  <div>
                    <div className="font-medium">{item.spot_name}</div>
                    <div className="text-sm text-muted-foreground">{item.ticket_name}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">¥{item.price.toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">× {item.quantity}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">
              共 {order.items?.reduce((sum, i) => sum + i.quantity, 0) || 0} 件商品
            </span>
            <div>
              <span className="text-muted-foreground mr-2">订单总额：</span>
              <span className="text-2xl font-bold text-primary">¥{order.total_amount.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>

        {order.status === "pending" && (
          <CardFooter className="flex gap-3">
            <Button variant="outline" className="flex-1 bg-transparent" onClick={handleCancel} disabled={isLoading}>
              取消订单
            </Button>
            <Button className="flex-1" onClick={handlePay} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CreditCard className="h-4 w-4 mr-2" />}
              立即支付
            </Button>
          </CardFooter>
        )}
      </Card>

      {order.status === "paid" && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-medium text-green-800">支付成功！</p>
                <p className="text-sm text-green-600">您可以凭订单号到景区换取门票入园</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
