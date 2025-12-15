"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import useSWR from "swr"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { ShoppingCart, Trash2, Plus, Minus, Loader2, Ticket, MapPin } from "lucide-react"
import type { CartItem } from "@/lib/types"
import { toast } from "sonner"
import { useCart } from "@/contexts/cart-context"

// Fetcher 函数
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
    if (!r.ok) throw new Error('获取购物车失败')
    return r.json()
  })
}

export function CartContent() {
  const router = useRouter()
  const { refreshCart } = useCart()
  const { data, error, isLoading, mutate } = useSWR('/api/cart', fetcher)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [loadingId, setLoadingId] = useState<number | null>(null)
  const [isCheckingOut, setIsCheckingOut] = useState(false)

  const items: CartItem[] = data?.data || []

  // 初始化全选状态
  useEffect(() => {
    if (items.length > 0 && selectedIds.length === 0) {
      setSelectedIds(items.map((item) => item.id))
    }
  }, [items])

  const selectedItems = items.filter((item) => selectedIds.includes(item.id))
  const totalAmount = selectedItems.reduce((sum, item) => sum + (item.ticket?.price || 0) * item.quantity, 0)

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? items.map((item) => item.id) : [])
  }

  const handleSelectItem = (itemId: number, checked: boolean) => {
    setSelectedIds((prev) => (checked ? [...prev, itemId] : prev.filter((id) => id !== itemId)))
  }

  const handleUpdateQuantity = async (itemId: number, delta: number) => {
    const item = items.find((i) => i.id === itemId)
    if (!item) return

    const newQuantity = item.quantity + delta
    if (newQuantity < 1) return
    if (newQuantity > (item.ticket?.stock || 0)) {
      toast.error("超出库存数量")
      return
    }

    setLoadingId(itemId)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/cart/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ quantity: newQuantity })
      })

      if (!response.ok) throw new Error('更新失败')

      // 乐观更新 UI
      mutate()
      toast.success("已更新数量")
    } catch (error) {
      toast.error("更新失败")
      console.error(error)
    } finally {
      setLoadingId(null)
    }
  }

  const handleRemove = async (itemId: number) => {
    setLoadingId(itemId)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/cart/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('删除失败')

      // 更新本地状态
      setSelectedIds((prev) => prev.filter((id) => id !== itemId))
      mutate()
      await refreshCart() // 刷新购物车数量
      toast.success("已移除")
    } catch (error) {
      toast.error("删除失败")
      console.error(error)
    } finally {
      setLoadingId(null)
    }
  }

  const handleCheckout = async () => {
    if (selectedItems.length === 0) {
      toast.error("请选择要购买的门票")
      return
    }

    setIsCheckingOut(true)

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push("/login")
        return
      }

      // 创建订单（API 会自动处理订单项和购物车清理）
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cart_item_ids: selectedItems.map(item => item.id)
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '创建订单失败')
      }

      const result = await response.json()

      // 刷新购物车数据
      mutate()
      await refreshCart() // 刷新购物车数量

      toast.success("订单创建成功")
      router.push(`/orders/${result.data.order.id}`)
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "创建订单失败")
    } finally {
      setIsCheckingOut(false)
    }
  }

  // 加载状态
  if (isLoading) {
    return (
      <div className="text-center py-16">
        <Loader2 className="h-16 w-16 mx-auto mb-4 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground">加载购物车中...</p>
      </div>
    )
  }

  // 错误状态
  if (error) {
    return (
      <div className="text-center py-16">
        <Card>
          <CardContent className="p-8">
            <ShoppingCart className="h-16 w-16 mx-auto mb-4 opacity-50 text-destructive" />
            <p className="text-lg font-semibold mb-2">加载失败</p>
            <p className="text-sm text-muted-foreground mb-4">{error.message || '无法获取购物车数据'}</p>
            <Button onClick={() => mutate()} variant="outline">
              重试
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 空购物车状态
  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-muted-foreground">
          <ShoppingCart className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">购物车是空的</p>
          <p className="text-sm mt-2">去挑选心仪的门票吧</p>
          <Link href="/tickets">
            <Button className="mt-6">浏览门票</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedIds.length === items.length}
                  onCheckedChange={handleSelectAll}
                  id="select-all"
                />
                <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                  全选 ({items.length})
                </label>
              </div>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="p-0">
            {items.map((item, index) => (
              <div key={item.id}>
                <div className="p-4 flex gap-4">
                  <Checkbox
                    checked={selectedIds.includes(item.id)}
                    onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                  />
                  <div className="w-24 h-20 rounded-md overflow-hidden flex-shrink-0">
                    <img
                      src={item.ticket?.spot?.images?.[0] || "/placeholder.svg?height=80&width=96&query=ticket"}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/spots/${item.ticket?.spot?.id}`} className="hover:text-primary transition-colors">
                      <h4 className="font-medium truncate">{item.ticket?.spot?.name}</h4>
                    </Link>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{item.ticket?.spot?.location}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm mt-1">
                      <Ticket className="h-3.5 w-3.5 text-primary" />
                      <span>{item.ticket?.name}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <div className="text-lg font-bold text-primary">¥{item.ticket?.price}</div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 bg-transparent"
                        onClick={() => handleUpdateQuantity(item.id, -1)}
                        disabled={item.quantity <= 1 || loadingId === item.id}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 bg-transparent"
                        onClick={() => handleUpdateQuantity(item.id, 1)}
                        disabled={loadingId === item.id}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleRemove(item.id)}
                      disabled={loadingId === item.id}
                    >
                      {loadingId === item.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                {index < items.length - 1 && <Separator />}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div>
        <Card className="sticky top-20">
          <CardHeader>
            <CardTitle>订单结算</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {selectedItems.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground truncate flex-1 mr-2">
                    {item.ticket?.name} x {item.quantity}
                  </span>
                  <span>¥{((item.ticket?.price || 0) * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">已选 {selectedItems.length} 件</span>
              <div className="text-right">
                <span className="text-sm text-muted-foreground">合计：</span>
                <span className="text-2xl font-bold text-primary">¥{totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              size="lg"
              onClick={handleCheckout}
              disabled={isCheckingOut || selectedItems.length === 0}
            >
              {isCheckingOut ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  创建订单中...
                </>
              ) : (
                "立即结算"
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
