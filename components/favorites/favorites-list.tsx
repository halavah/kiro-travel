"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Star, Heart, Trash2, Loader2 } from "lucide-react"
import type { Spot } from "@/lib/types"
import { toast } from "sonner"

interface FavoriteItem {
  id: string
  spot_id: string
  created_at: string
  spot: Spot
}

interface FavoritesListProps {
  favorites: FavoriteItem[]
}

export function FavoritesList({ favorites: initialFavorites }: FavoritesListProps) {
  const router = useRouter()
  const [favorites, setFavorites] = useState(initialFavorites)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const handleRemove = async (favoriteId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    setRemovingId(favoriteId)

    try {
      const { error } = await supabase.from("spot_favorites").delete().eq("id", favoriteId)

      if (error) throw error

      setFavorites((prev) => prev.filter((f) => f.id !== favoriteId))
      toast.success("已取消收藏")
    } catch (error) {
      toast.error("操作失败")
    } finally {
      setRemovingId(null)
    }
  }

  if (favorites.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-muted-foreground">
          <Heart className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">暂无收藏的景点</p>
          <p className="text-sm mt-2">去发现心仪的目的地吧</p>
          <Link href="/spots">
            <Button className="mt-6">浏览景点</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {favorites.map((favorite) => (
        <Link key={favorite.id} href={`/spots/${favorite.spot.id}`}>
          <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 h-full">
            <div className="relative h-48 overflow-hidden">
              <img
                src={favorite.spot.images?.[0] || "/placeholder.svg?height=200&width=300&query=scenic landscape"}
                alt={favorite.spot.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-3 right-3 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => handleRemove(favorite.id, e)}
                disabled={removingId === favorite.id}
              >
                {removingId === favorite.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
              {favorite.spot.category && (
                <Badge variant="secondary" className="absolute top-3 left-3">
                  {favorite.spot.category.name}
                </Badge>
              )}
            </div>
            <CardContent className="p-4">
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                {favorite.spot.name}
              </h3>
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <MapPin className="h-3.5 w-3.5" />
                <span className="line-clamp-1">{favorite.spot.location}</span>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{favorite.spot.rating}</span>
                </div>
                <div className="text-primary font-semibold">
                  {favorite.spot.price > 0 ? `¥${favorite.spot.price}` : "免费"}
                </div>
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                收藏于 {new Date(favorite.created_at).toLocaleDateString("zh-CN")}
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
