"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Star, ArrowRight } from "lucide-react"
import Link from "next/link"
import type { Spot } from "@/lib/types"

export function RecommendedSpots() {
  const [spots, setSpots] = useState<Spot[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRecommendedSpots() {
      try {
        const res = await fetch('/api/spots?is_recommended=true&limit=6')
        const data = await res.json()

        if (data.success && data.data) {
          setSpots(data.data)
        }
      } catch (error) {
        console.error("Error fetching spots:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecommendedSpots()
  }, [])

  if (loading) {
    return (
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">推荐景点</h2>
            <p className="text-muted-foreground">为您精选的热门旅游目的地</p>
          </div>
          <Link href="/spots">
            <Button variant="outline" className="gap-2 bg-transparent">
              查看全部 <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {spots.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {spots.map((spot) => (
              <Link key={spot.id} href={`/spots/${spot.id}`}>
                <Card className="overflow-hidden h-full hover:shadow-lg transition-shadow group">
                  <div className="aspect-[4/3] relative overflow-hidden">
                    <img
                      src={
                        spot.images?.[0] ||
                        `/placeholder.svg?height=300&width=400&query=${encodeURIComponent(spot.name + " scenic spot")}`
                      }
                      alt={spot.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <Badge className="absolute top-3 left-3 bg-primary">推荐</Badge>
                    {spot.category?.name && (
                      <Badge variant="secondary" className="absolute top-3 right-3">
                        {spot.category.name}
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                      {spot.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{spot.description || "暂无描述"}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {spot.location || "未知位置"}
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-medium">{spot.rating?.toFixed(1) || "5.0"}</span>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t flex items-center justify-between">
                      <span className="text-primary font-bold text-lg">¥{spot.price}</span>
                      <span className="text-sm text-muted-foreground">{spot.view_count || 0} 次浏览</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">暂无推荐景点</div>
        )}
      </div>
    </section>
  )
}
