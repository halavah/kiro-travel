"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  MapPin,
  Star,
  Eye,
  Heart,
  ThumbsUp,
  Ticket,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Calendar,
  ShoppingCart,
} from "lucide-react"
import Link from "next/link"
import type { Spot, Ticket as TicketType } from "@/lib/types"
import { toast } from "sonner"
import { useCart } from "@/contexts/cart-context"

interface SpotDetailProps {
  spot: Spot
  tickets: TicketType[]
  isLoggedIn: boolean
}

export function SpotDetail({ spot, tickets, isLoggedIn }: SpotDetailProps) {
  const router = useRouter()
  const { refreshCart } = useCart()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isLiked, setIsLiked] = useState(spot.is_liked || false)
  const [isFavorited, setIsFavorited] = useState(spot.is_favorited || false)
  const [likesCount, setLikesCount] = useState(spot.likes_count || 0)
  const [isLoading, setIsLoading] = useState<string | null>(null)

  const images = spot.images?.length ? spot.images : ["/beautiful-scenic-spot.jpg"]

  const handleLike = async () => {
    if (!isLoggedIn) {
      router.push("/auth/sign-in")
      return
    }

    setIsLoading("like")

    try {
      const response = await fetch(`/api/spots/${spot.id}/like`, {
        method: 'POST',
        credentials: 'include' // 自动发送 cookie
      })

      if (response.status === 401) {
        router.push("/auth/sign-in")
        return
      }

      if (!response.ok) throw new Error('操作失败')

      const result = await response.json()
      if (result.success) {
        setIsLiked(result.data.liked)
        setLikesCount(result.data.likeCount)
        toast.success(result.message)
      }
    } catch (error) {
      toast.error("操作失败")
    } finally {
      setIsLoading(null)
    }
  }

  const handleFavorite = async () => {
    if (!isLoggedIn) {
      router.push("/auth/sign-in")
      return
    }

    setIsLoading("favorite")

    try {
      const response = await fetch(`/api/spots/${spot.id}/favorite`, {
        method: 'POST',
        credentials: 'include' // 自动发送 cookie
      })

      if (response.status === 401) {
        router.push("/auth/sign-in")
        return
      }

      if (!response.ok) throw new Error('操作失败')

      const result = await response.json()
      if (result.success) {
        setIsFavorited(result.data.favorited)
        toast.success(result.message)
      }
    } catch (error) {
      toast.error("操作失败")
    } finally {
      setIsLoading(null)
    }
  }

  const handleAddToCart = async (ticketId: string) => {
    if (!isLoggedIn) {
      router.push("/auth/sign-in")
      return
    }

    setIsLoading(ticketId)

    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // 自动发送 cookie
        body: JSON.stringify({
          ticket_id: ticketId,
          quantity: 1
        })
      })

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/auth/sign-in")
          return
        }
        throw new Error('添加失败')
      }

      await refreshCart() // 刷新购物车数量
      toast.success("已添加到购物车")
      router.refresh()
    } catch (error) {
      toast.error("添加失败")
    } finally {
      setIsLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      <Link
        href="/spots"
        className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        返回景点列表
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 图片展示 */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-muted">
            <img
              src={images[currentImageIndex] || "/placeholder.svg"}
              alt={spot.name}
              className="w-full h-full object-cover"
            />
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background"
                  onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background"
                  onClick={() => setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentImageIndex ? "bg-primary" : "bg-white/50"
                      }`}
                      onClick={() => setCurrentImageIndex(index)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* 缩略图 */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((img, index) => (
                <button
                  key={index}
                  className={`flex-shrink-0 w-20 h-14 rounded-md overflow-hidden border-2 transition-colors ${
                    index === currentImageIndex ? "border-primary" : "border-transparent"
                  }`}
                  onClick={() => setCurrentImageIndex(index)}
                >
                  <img src={img || "/placeholder.svg"} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* 景点详情 */}
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl font-bold text-foreground">{spot.name}</h1>
                    {spot.is_recommended && <Badge className="bg-primary">推荐</Badge>}
                    {spot.category && <Badge variant="secondary">{spot.category.name}</Badge>}
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {spot.address || spot.location}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">{spot.price > 0 ? `¥${spot.price}` : "免费"}</div>
                  <div className="text-sm text-muted-foreground">起</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-6 text-sm">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{spot.rating}</span>
                  <span className="text-muted-foreground">评分</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Eye className="h-4 w-4" />
                  <span>{spot.view_count} 浏览</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <ThumbsUp className="h-4 w-4" />
                  <span>{likesCount} 点赞</span>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-2">景点介绍</h3>
                <p className="text-muted-foreground leading-relaxed">{spot.description}</p>
              </div>

              <Separator />

              <div className="flex flex-wrap gap-2">
                <Button
                  variant={isLiked ? "default" : "outline"}
                  size="sm"
                  onClick={handleLike}
                  disabled={isLoading === "like"}
                >
                  {isLoading === "like" ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <ThumbsUp className={`h-4 w-4 mr-1 ${isLiked ? "fill-current" : ""}`} />
                  )}
                  {isLiked ? "已点赞" : "点赞"}
                </Button>
                <Button
                  variant={isFavorited ? "default" : "outline"}
                  size="sm"
                  onClick={handleFavorite}
                  disabled={isLoading === "favorite"}
                >
                  {isLoading === "favorite" ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Heart className={`h-4 w-4 mr-1 ${isFavorited ? "fill-current" : ""}`} />
                  )}
                  {isFavorited ? "已收藏" : "收藏"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/spots/${spot.id}/booking`)}
                >
                  <Ticket className="h-4 w-4 mr-1" />
                  立即预订
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 门票信息 */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="h-5 w-5 text-primary" />
                门票预订
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {tickets.length > 0 ? (
                tickets.map((ticket) => (
                  <div key={ticket.id} className="p-4 rounded-lg border bg-card">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{ticket.name}</h3>
                          <Badge variant={ticket.stock < 20 ? "destructive" : "secondary"}>
                            {ticket.stock < 20 ? "库存紧张" : "有票"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{ticket.description || "标准门票"}</p>
                        {ticket.valid_from && ticket.valid_to && (
                          <p className="text-xs text-muted-foreground mt-1">
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              有效期: {new Date(ticket.valid_from).toLocaleDateString("zh-CN")} -{" "}
                              {new Date(ticket.valid_to).toLocaleDateString("zh-CN")}
                            </span>
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">¥{ticket.price}</div>
                        <div className={`text-sm ${ticket.stock < 20 ? 'text-red-600' : 'text-muted-foreground'}`}>
                          剩余: {ticket.stock} 张
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-3">
                      <Button
                        className="flex-1"
                        onClick={() => handleAddToCart(ticket.id)}
                        disabled={ticket.stock === 0 || isLoading === ticket.id}
                      >
                        {isLoading === ticket.id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <>
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            加入购物车
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/spots/${spot.id}/booking?ticket=${ticket.id}`)}
                      >
                        立即预订
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Ticket className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>暂无可购买的门票</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">温馨提示</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>• 门票当日有效，过期作废</p>
              <p>• 请携带有效身份证件入园</p>
              <p>• 儿童票需成人陪同</p>
              <p>• 如有疑问请拨打客服热线</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
