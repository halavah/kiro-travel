'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ShoppingBag, CreditCard, ArrowLeft } from "lucide-react"
import { toast } from "sonner"

interface CartItem {
  id: string
  quantity: number
  ticket_name: string
  ticket_price: number
  spot_name: string
}

export default function CheckoutPage() {
  const router = useRouter()
  const [items, setItems] = useState<CartItem[]>([])
  const [totalAmount, setTotalAmount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchCart()
  }, [])

  const fetchCart = async () => {
    try {
      const res = await fetch('/api/cart', {
        credentials: 'include' // 自动发送 cookie
      })

      if (res.status === 401) {
        router.push('/auth/sign-in')
        return
      }

      if (!res.ok) {
        throw new Error('Failed to fetch cart')
      }

      const data = await res.json()
      setItems(data.items)
      setTotalAmount(data.totalAmount)

      if (data.items.length === 0) {
        router.push('/cart')
      }
    } catch (error) {
      console.error('Error fetching cart:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitOrder = async () => {
    if (items.length === 0) {
      toast.error('购物车为空')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // 自动发送 cookie
        body: JSON.stringify({}) // 发送空对象，API 会从购物车获取所有商品
      })

      if (!res.ok) {
        const error = await res.json()
        toast.error(error.error || '创建订单失败')
        return
      }

      const data = await res.json()
      toast.success('订单创建成功！')
      router.push(`/orders/${data.data.order.id}`)
    } catch (error) {
      console.error('Error creating order:', error)
      toast.error('创建订单失败，请重试')
    } finally {
      setSubmitting(false)
    }
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
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.push('/cart')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回购物车
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 订单明细 */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="w-6 h-6" />
                确认订单
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-3">订单商品</h3>
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div key={item.id} className="flex justify-between items-start p-4 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{item.ticket_name}</h4>
                          <p className="text-sm text-muted-foreground">{item.spot_name}</p>
                          <div className="mt-2 text-sm">
                            <span className="text-muted-foreground">单价: </span>
                            <span className="font-medium">¥{item.ticket_price.toFixed(2)}</span>
                            <span className="text-muted-foreground ml-4">数量: </span>
                            <span className="font-medium">×{item.quantity}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">
                            ¥{(item.ticket_price * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 结算信息 */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>订单金额</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>商品数量</span>
                  <span>{items.reduce((sum, item) => sum + item.quantity, 0)} 件</span>
                </div>
                <div className="flex justify-between">
                  <span>商品总价</span>
                  <span>¥{totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between text-lg font-bold">
                <span>应付金额</span>
                <span className="text-primary">¥{totalAmount.toFixed(2)}</span>
              </div>

              <div className="space-y-2">
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleSubmitOrder}
                  disabled={submitting || items.length === 0}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  {submitting ? '提交中...' : '提交订单'}
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push('/cart')}
                  disabled={submitting}
                >
                  返回购物车
                </Button>
              </div>

              <div className="text-xs text-muted-foreground text-center pt-2">
                点击"提交订单"即表示您同意遵守我们的服务条款
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
