"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Ticket, ShoppingCart, Loader2, Calendar } from "lucide-react"
import type { Ticket as TicketType, Spot } from "@/lib/types"
import { toast } from "sonner"
import { useCart } from "@/contexts/cart-context"

interface TicketWithSpot extends TicketType {
  spot: Spot & { category?: { name: string } }
}

interface TicketsListProps {
  tickets: TicketWithSpot[]
  totalCount: number
}

export function TicketsList({ tickets, totalCount }: TicketsListProps) {
  const router = useRouter()
  const { refreshCart } = useCart()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleAddToCart = async (ticket: TicketWithSpot, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    setLoadingId(ticket.id)
    const token = localStorage.getItem('token')

    if (!token) {
      router.push("/login")
      setLoadingId(null)
      return
    }

    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ticket_id: ticket.id,
          quantity: 1
        })
      })

      if (!response.ok) throw new Error('添加失败')

      await refreshCart() // 刷新购物车数量
      toast.success("已添加到购物车")
      router.refresh()
    } catch (error) {
      toast.error("添加失败")
    } finally {
      setLoadingId(null)
    }
  }

  if (tickets.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-muted-foreground">
          <Ticket className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg">暂无门票信息</p>
          <p className="text-sm mt-2">请尝试其他搜索条件</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="text-sm text-muted-foreground mb-4">共找到 {totalCount} 张门票</div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tickets.map((ticket) => {
          return (
            <Card key={ticket.id} className="group overflow-hidden hover:shadow-lg transition-all duration-300">
              <Link href={`/spots/${ticket.spot.id}`}>
                <div className="relative h-40 overflow-hidden">
                  <img
                    src={ticket.spot.images?.[0] || "/placeholder.svg?height=160&width=400&query=scenic spot"}
                    alt={ticket.spot.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {ticket.spot.category && (
                    <Badge variant="secondary" className="absolute top-3 left-3">
                      {ticket.spot.category.name}
                    </Badge>
                  )}
                </div>
              </Link>
              <CardContent className="p-4">
                <Link href={`/spots/${ticket.spot.id}`}>
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {ticket.spot.name}
                  </h3>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                    <MapPin className="h-3.5 w-3.5" />
                    <span className="line-clamp-1">{ticket.spot.location}</span>
                  </div>
                </Link>

                <div className="mt-3 p-3 rounded-lg bg-muted/50">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Ticket className="h-4 w-4 text-primary" />
                        <span className="font-medium">{ticket.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{ticket.description}</p>
                      {ticket.valid_from && ticket.valid_to && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(ticket.valid_from).toLocaleDateString("zh-CN")} -{" "}
                          {new Date(ticket.valid_to).toLocaleDateString("zh-CN")}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-primary">¥{ticket.price}</div>
                      <div className="text-xs text-muted-foreground">库存 {ticket.stock}</div>
                    </div>
                  </div>
                </div>

                <Button
                  className="w-full mt-3"
                  onClick={(e) => handleAddToCart(ticket, e)}
                  disabled={ticket.stock === 0 || loadingId === ticket.id}
                >
                  {loadingId === ticket.id ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <ShoppingCart className="h-4 w-4 mr-2" />
                  )}
                  {ticket.stock === 0 ? "已售罄" : "加入购物车"}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
