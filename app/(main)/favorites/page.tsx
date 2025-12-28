'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, MapPin, Star, Trash2 } from "lucide-react"
import Image from 'next/image'

interface Favorite {
  favorite_id: string
  spot_id: string
  spot_name: string
  location: string
  description: string
  images: string[]
  rating: number
  price_range: string
  category_name: string
  created_at: string
}

export default function FavoritesPage() {
  const router = useRouter()
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState<string | null>(null)

  useEffect(() => {
    fetchFavorites()
  }, [])

  const fetchFavorites = async () => {
    try {
      const res = await fetch('/api/favorites', {
        credentials: 'include' // 自动发送 cookie
      })

      if (res.status === 401) {
        router.push('/auth/sign-in')
        return
      }

      if (!res.ok) {
        throw new Error('Failed to fetch favorites')
      }

      const data = await res.json()
      setFavorites(data.favorites)
    } catch (error) {
      console.error('Error fetching favorites:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (spotId: string) => {
    if (!confirm('确定要取消收藏吗？')) return

    setRemoving(spotId)
    try {
      const res = await fetch(`/api/favorites?spot_id=${spotId}`, {
        method: 'DELETE',
        credentials: 'include' // 自动发送 cookie
      })

      if (!res.ok) {
        throw new Error('Failed to remove favorite')
      }

      await fetchFavorites()
    } catch (error) {
      console.error('Error removing favorite:', error)
      alert('取消收藏失败，请重试')
    } finally {
      setRemoving(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-6 h-6" />
            我的收藏
          </CardTitle>
        </CardHeader>
        <CardContent>
          {favorites.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">还没有收藏</h3>
              <p className="text-muted-foreground mb-6">
                快去收藏您喜欢的景点吧！
              </p>
              <Button onClick={() => router.push('/spots')}>
                去逛逛
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.map((favorite) => (
                <Card key={favorite.favorite_id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  {/* 景点图片 */}
                  <div className="relative h-48 bg-muted">
                    {favorite.images?.[0] ? (
                      <Image
                        src={favorite.images[0]}
                        alt={favorite.spot_name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        无图片
                      </div>
                    )}
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => handleRemove(favorite.spot_id)}
                      disabled={removing === favorite.spot_id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* 景点信息 */}
                  <CardContent className="p-4">
                    <div className="mb-2">
                      <h3 className="font-semibold text-lg mb-1">
                        {favorite.spot_name}
                      </h3>
                      <Badge variant="secondary" className="text-xs">
                        {favorite.category_name}
                      </Badge>
                    </div>

                    <div className="space-y-2 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{favorite.location}</span>
                      </div>
                      {favorite.rating > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span>{favorite.rating.toFixed(1)}</span>
                        </div>
                      )}
                      {favorite.price_range && (
                        <div className="text-primary font-semibold">
                          {favorite.price_range}
                        </div>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {favorite.description}
                    </p>

                    <div className="flex gap-2">
                      <Button
                        className="flex-1"
                        onClick={() => router.push(`/spots/${favorite.spot_id}`)}
                      >
                        查看详情
                      </Button>
                    </div>

                    <div className="text-xs text-muted-foreground text-center mt-2">
                      收藏于 {formatDate(favorite.created_at)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

