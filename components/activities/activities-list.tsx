"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Calendar, Users, Compass } from "lucide-react"
import type { Activity } from "@/lib/types"

interface ActivitiesListProps {
  activities: Activity[]
  totalCount: number
}

export function ActivitiesList({ activities, totalCount }: ActivitiesListProps) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-muted-foreground">
          <Compass className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg">暂无旅游活动</p>
          <p className="text-sm mt-2">请尝试其他搜索条件</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="text-sm text-muted-foreground mb-4">共找到 {totalCount} 个活动</div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activities.map((activity) => (
          <Link key={activity.id} href={`/activities/${activity.id}`}>
            <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 h-full">
              <div className="relative h-48 overflow-hidden">
                <img
                  src={activity.images?.[0] || "/placeholder.svg?height=200&width=400&query=travel adventure activity"}
                  alt={activity.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {activity.activity_type && (
                  <Badge variant="secondary" className="absolute top-3 left-3">
                    {activity.activity_type}
                  </Badge>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                  {activity.name}
                </h3>
                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="line-clamp-1">{activity.location}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{activity.description}</p>

                <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-muted-foreground">
                  {activity.start_date && activity.end_date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(activity.start_date).toLocaleDateString("zh-CN")} -{" "}
                      {new Date(activity.end_date).toLocaleDateString("zh-CN")}
                    </div>
                  )}
                  {activity.max_participants && (
                    <div className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />限{activity.max_participants}人
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                  <Badge variant="outline">{activity.activity_type || "体验活动"}</Badge>
                  <div className="text-primary font-semibold">{activity.price ? `¥${activity.price}起` : "免费"}</div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
