"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { ShoppingCart, Trash2, Plus, Minus, Loader2, Ticket, MapPin } from "lucide-react"
import type { CartItem } from "@/lib/types"
import { toast } from "sonner"

interface CartContentProps {
  cartItems: CartItem[]
}

export function CartContent({ cartItems: initialItems }: CartContentProps) {
  const router = useRouter()
  const [items, setItems] = useState(initialItems)
  const [selectedIds, setSelectedIds] = useState<string[]>(initialItems.map((item) => item.id))
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [isCheckingOut, setIsCheckingOut] = useState(false)

  const selectedItems = items.filter((item) => selectedIds.includes(item.id))
  const totalAmount = selectedItems.reduce((sum, item) => sum + (item.ticket?.price || 0) * item.quantity, 0)

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? items.map((item) => item.id) : [])
  }

  const handleSelectItem = (itemId: string, checked: boolean) => {
    setSelectedIds((prev) => (checked ? [...prev, itemId] : prev.filter((id) => id !== itemId)))
  }

  const handleUpdateQuantity = async (itemId: string, delta: number) => {
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
      await supabase.from("cart_items").update({ quantity: newQuantity }).eq("id", itemId)

      setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, quantity: newQuantity } : i)))
    } catch (error) {
      toast.error("更新失败")
    } finally {
      setLoadingId(null)
    }
  }

  const handleRemove = async (itemId: string) => {
    setLoadingId(itemId)

    try {
      await supabase.from("cart_items").delete().eq("id", itemId)

      setItems((prev) => prev.filter((i) => i.id !== itemId))
      setSelectedIds((prev) => prev.filter((id) => id !== itemId))
      toast.success("已移除")
      router.refresh()
    } catch (error) {
      toast.error("删除失败")
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
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/auth/login")
      return
    }

    try {
      // 生成订单号
      const orderNo = `ORD${Date.now()}${Math.random().toString(36).slice(2, 8).toUpperCase()}`

      // 创建订单
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          order_no: orderNo,
          total_amount: totalAmount,
          status: "pending",
        })
        .select()
        .single()

      if (orderError) throw orderError

      // 创建订单详情
      const orderItems = selectedItems.map((item) => ({
        order_id: order.id,
        ticket_id: item.ticket_id,
        ticket_name: item.ticket?.name || "",
        spot_name: item.ticket?.spot?.name || "",
        price: item.ticket?.price || 0,
        quantity: item.quantity,
      }))

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

      if (itemsError) throw itemsError

      // 删除购物车中已购买的商品
      await supabase
        .from("cart_items")
        .delete()
        .in(
          "id",
          selectedItems.map((i) => i.id),
        )

      toast.success("订单创建成功")
      router.push(`/orders/${order.id}`)
    } catch (error) {
      console.error(error)
      toast.error("创建订单失败")
    } finally {
      setIsCheckingOut(false)
    }
  }

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
