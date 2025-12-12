"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Star, Hotel, Wifi, Car, UtensilsCrossed } from "lucide-react"
import type { Hotel as HotelType } from "@/lib/types"

interface HotelsListProps {
  hotels: HotelType[]
  totalCount: number
}

const amenityIcons: Record<string, typeof Wifi> = {
  免费WiFi: Wifi,
  停车场: Car,
  餐厅: UtensilsCrossed,
}

export function HotelsList({ hotels, totalCount }: HotelsListProps) {
  if (hotels.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-muted-foreground">
          <Hotel className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg">暂无酒店信息</p>
          <p className="text-sm mt-2">请尝试其他搜索条件</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="text-sm text-muted-foreground mb-4">共找到 {totalCount} 家酒店</div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hotels.map((hotel) => (
          <Link key={hotel.id} href={`/hotels/${hotel.id}`}>
            <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 h-full">
              <div className="relative h-48 overflow-hidden">
                <img
                  src={hotel.images?.[0] || "/placeholder.svg?height=200&width=400&query=luxury hotel"}
                  alt={hotel.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {hotel.star_rating && (
                  <Badge className="absolute top-3 left-3 bg-yellow-500">{hotel.star_rating}星级</Badge>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                  {hotel.name}
                </h3>
                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="line-clamp-1">{hotel.location}</span>
                </div>

                {hotel.amenities && hotel.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {hotel.amenities.slice(0, 3).map((amenity) => {
                      const Icon = amenityIcons[amenity]
                      return (
                        <Badge key={amenity} variant="secondary" className="text-xs">
                          {Icon && <Icon className="h-3 w-3 mr-1" />}
                          {amenity}
                        </Badge>
                      )
                    })}
                    {hotel.amenities.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{hotel.amenities.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: hotel.star_rating || 0 }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <div className="text-right">
                    <span className="text-primary font-bold text-lg">¥{hotel.price_min}</span>
                    <span className="text-muted-foreground text-sm">起/晚</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
