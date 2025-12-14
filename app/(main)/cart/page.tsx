'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react"
import Image from 'next/image'
import { toast } from "sonner"

interface CartItem {
  id: string
  quantity: number
  ticket_id: string
  ticket_name: string
  ticket_description: string
  ticket_price: number
  ticket_stock: number
  spot_id: string
  spot_name: string
  spot_location: string
  spot_images: string[]
}

export default function CartPage() {
  const router = useRouter()
  const [items, setItems] = useState<CartItem[]>([])
  const [totalAmount, setTotalAmount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  // 获取购物车数据
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
    } catch (error) {
      console.error('Error fetching cart:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCart()
  }, [])

  // 更新数量
  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 0) return

    setUpdating(itemId)
    try {
      const res = await fetch(`/api/cart/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // 自动发送 cookie
        body: JSON.stringify({ quantity: newQuantity })
      })

      if (!res.ok) {
        const error = await res.json()
        toast.error(error.error || 'Failed to update quantity')
        return
      }

      await fetchCart()
    } catch (error) {
      console.error('Error updating quantity:', error)
      toast.error('Failed to update quantity')
    } finally {
      setUpdating(null)
    }
  }

  // 删除商品
  const removeItem = async (itemId: string) => {
    if (!confirm('确定要删除这个商品吗？')) return

    setUpdating(itemId)
    try {
      const res = await fetch(`/api/cart/${itemId}`, {
        method: 'DELETE',
        credentials: 'include' // 自动发送 cookie
      })

      if (!res.ok) {
        throw new Error('Failed to remove item')
      }

      await fetchCart()
      toast.success('商品已删除')
    } catch (error) {
      console.error('Error removing item:', error)
      toast.error('Failed to remove item')
    } finally {
      setUpdating(null)
    }
  }

  // 清空购物车
  const clearCart = async () => {
    if (!confirm('确定要清空购物车吗？')) return

    setLoading(true)
    try {
      const res = await fetch('/api/cart', {
        method: 'DELETE',
        credentials: 'include' // 自动发送 cookie
      })

      if (!res.ok) {
        throw new Error('Failed to clear cart')
      }

      await fetchCart()
    } catch (error) {
      console.error('Error clearing cart:', error)
      alert('Failed to clear cart')
    } finally {
      setLoading(false)
    }
  }

  // 去结算
  const checkout = () => {
    if (items.length === 0) {
      toast.error('购物车为空')
      return
    }
    router.push('/checkout')
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">加载中...</div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-12 text-center">
            <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">购物车是空的</h2>
            <p className="text-muted-foreground mb-6">快去挑选心仪的门票吧！</p>
            <Button onClick={() => router.push('/spots')}>
              去逛逛
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 购物车列表 */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>购物车 ({items.length} 件商品)</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearCart}
                disabled={loading}
              >
                清空购物车
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 p-4 border rounded-lg">
                  {/* 商品图片 */}
                  <div className="relative w-24 h-24 flex-shrink-0 bg-muted rounded overflow-hidden">
                    {item.spot_images?.[0] ? (
                      <Image
                        src={item.spot_images[0]}
                        alt={item.spot_name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        无图片
                      </div>
                    )}
                  </div>

                  {/* 商品信息 */}
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.ticket_name}</h3>
                    <p className="text-sm text-muted-foreground">{item.spot_name}</p>
                    <p className="text-sm text-muted-foreground">{item.spot_location}</p>
                    <div className="mt-2">
                      <span className="text-lg font-bold text-primary">
                        ¥{item.ticket_price.toFixed(2)}
                      </span>
                      <span className="text-sm text-muted-foreground ml-2">
                        库存: {item.ticket_stock}
                      </span>
                    </div>
                  </div>

                  {/* 数量控制 */}
                  <div className="flex flex-col justify-between items-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.id)}
                      disabled={updating === item.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={updating === item.id || item.quantity <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-12 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={updating === item.id || item.quantity >= item.ticket_stock}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">小计</div>
                      <div className="font-bold">
                        ¥{(item.ticket_price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* 结算信息 */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>订单摘要</CardTitle>
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

              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>合计</span>
                  <span className="text-primary">¥{totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={checkout}
              >
                去结算
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push('/spots')}
              >
                继续购物
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
